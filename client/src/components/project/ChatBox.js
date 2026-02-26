import { useEffect, useRef, useState } from "react";
import API from "../../services/api";
import socket from "../../services/socket";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🎉", "🔥", "✅"];

function ReactionPicker({ onPick }) {
  return (
    <div className="absolute bottom-full left-0 z-20 mb-1 flex gap-1 rounded-xl border border-slate-700 bg-slate-900 px-2 py-1.5 shadow-lg">
      {QUICK_EMOJIS.map((e) => (
        <button
          key={e}
          className="rounded px-1 py-0.5 text-lg hover:bg-slate-800 transition"
          onClick={() => onPick(e)}
          aria-label={`React with ${e}`}
        >
          {e}
        </button>
      ))}
    </div>
  );
}

function MentionDropdown({ members, filter, onSelect }) {
  const filtered = members.filter(
    (m) => m.name && m.name.toLowerCase().startsWith(filter.toLowerCase()),
  );
  if (!filtered.length) return null;
  return (
    <div className="absolute bottom-full left-0 z-20 mb-1 w-48 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-lg">
      {filtered.slice(0, 5).map((m) => (
        <button
          key={m.id || m.user_id}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(m.name.replace(/\s+/g, ""));
          }}
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-300">
            {m.name[0].toUpperCase()}
          </span>
          {m.name}
        </button>
      ))}
    </div>
  );
}

function renderContent(content) {
  // Highlight @mentions in cyan
  const parts = content.split(/(@\w+)/g);
  return parts.map((part, i) =>
    /^@\w+/.test(part) ? (
      <span key={i} className="font-semibold text-cyan-400">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export default function ChatBox({ projectId }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [files, setFiles] = useState([]);
  const [user, setUser] = useState(null);
  const [canChat, setCanChat] = useState(true);
  const [members, setMembers] = useState([]);
  // Reactions: { [messageId]: { [emoji]: count } }
  const [reactions, setReactions] = useState({});
  // Which message has the reaction picker open
  const [pickerOpen, setPickerOpen] = useState(null);
  // @mention autocomplete
  const [mentionFilter, setMentionFilter] = useState(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!projectId) return;

    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));

    const roomId = String(projectId);
    const joinProjectRoom = () => socket.emit("joinProject", roomId);
    joinProjectRoom();

    API.get(`/messages/${projectId}`).then((res) => setMessages(res.data));
    API.get(`/files/${projectId}`).then((res) => setFiles(res.data));
    API.get(`/projects/${projectId}/member-list`)
      .then((res) => setMembers(res.data || []))
      .catch(() => {});

    const onReceiveMessage = (data) => setMessages((prev) => [...prev, data]);
    const onChatError = (data) =>
      alert(data?.message || "Unable to send message");
    const onReactionsUpdated = ({ messageId, reactions: r }) => {
      // Server sends array [{emoji, count}]; convert to {emoji: count} map
      const reactionMap = Array.isArray(r)
        ? Object.fromEntries(r.map((item) => [item.emoji, Number(item.count)]))
        : r;
      setReactions((prev) => ({ ...prev, [messageId]: reactionMap }));
    };

    socket.on("receiveMessage", onReceiveMessage);
    socket.on("chatError", onChatError);
    socket.on("reactionsUpdated", onReactionsUpdated);
    socket.on("connect", joinProjectRoom);

    return () => {
      socket.emit("leaveProject", roomId);
      socket.off("receiveMessage", onReceiveMessage);
      socket.off("chatError", onChatError);
      socket.off("reactionsUpdated", onReactionsUpdated);
      socket.off("connect", joinProjectRoom);
    };
  }, [projectId]);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const res = await API.get(`/projects/${projectId}/permissions`);
        setCanChat(Boolean(res.data?.permissions?.can_chat));
      } catch {
        setCanChat(false);
      }
    };
    loadPermissions();
  }, [projectId]);

  // Mark notifications as read
  useEffect(() => {
    const markRead = async () => {
      try {
        const res = await API.get("/notifications");
        const projectTag = `[Project ${projectId}]`;
        const legacyTag = `in project ${projectId}`;
        const targets = res.data.filter(
          (n) =>
            !n.is_read &&
            typeof n.message === "string" &&
            (n.message.includes(projectTag) || n.message.includes(legacyTag)),
        );
        if (!targets.length) return;
        await Promise.all(
          targets.map((n) => API.put(`/notifications/${n.id}`)),
        );
        window.dispatchEvent(new Event("notifications:refresh"));
      } catch {
        /* no-op */
      }
    };
    markRead();
  }, [projectId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Detect @mention in input
  const handleInputChange = (e) => {
    const val = e.target.value;
    setMessage(val);
    const cursor = e.target.selectionStart;
    const textBefore = val.slice(0, cursor);
    const mentionMatch = textBefore.match(/@(\w*)$/);
    if (mentionMatch) {
      setMentionFilter(mentionMatch[1]);
    } else {
      setMentionFilter(null);
    }
  };

  const handleMentionSelect = (username) => {
    setMentionFilter(null);
    const cursor = inputRef.current.selectionStart;
    const textBefore = message.slice(0, cursor);
    const textAfter = message.slice(cursor);
    const replaced = textBefore.replace(/@(\w*)$/, `@${username} `) + textAfter;
    setMessage(replaced);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const sendMessage = () => {
    if (!user) {
      alert("Please login again");
      return;
    }
    if (!message.trim()) return;
    if (!canChat) {
      alert("Chat permission denied");
      return;
    }
    socket.emit("sendMessage", {
      projectId,
      content: message,
      senderId: user.id,
    });
    setMessage("");
    setMentionFilter(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleReaction = (messageId, emoji) => {
    if (!user) return;
    socket.emit("toggleReaction", {
      messageId,
      userId: user.id,
      emoji,
      projectId,
    });
    setPickerOpen(null);
  };

  return (
    <section className="panel-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Team Chat</h3>
            <p className="text-xs text-slate-400">{messages.length} messages</p>
          </div>
        </div>
        {!canChat && (
          <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-xs text-rose-300">
            Read-only
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="h-80 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/60 text-slate-500">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-sm text-slate-400">
              No messages yet. Say hello! 👋
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, i) => {
              const isMe = user && msg.sender_id === user.id;
              const senderLabel = isMe ? "You" : msg.sender_name || "Member";
              const initials =
                senderLabel === "You" ? user?.name?.[0] || "Y" : senderLabel[0];
              const msgReactions = reactions[msg.id] || {};
              const hasReactions = Object.keys(msgReactions).length > 0;

              return (
                <div
                  key={msg.id || i}
                  className={`group flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isMe
                        ? "bg-cyan-500/20 text-cyan-300"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {initials.toUpperCase()}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`relative max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}
                  >
                    {!isMe && (
                      <span className="ml-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        {senderLabel}
                      </span>
                    )}
                    <div
                      className={`relative rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        isMe
                          ? "rounded-br-sm bg-gradient-to-br from-cyan-500/25 to-sky-500/15 text-slate-100 ring-1 ring-cyan-500/20"
                          : "rounded-bl-sm border border-slate-700/80 bg-slate-800/80 text-slate-100"
                      }`}
                    >
                      <p className="break-words">
                        {renderContent(msg.content)}
                      </p>

                      {/* Reaction button */}
                      <button
                        className={`absolute -top-2 ${isMe ? "left-1" : "right-1"} rounded-full border border-slate-700 bg-slate-900 p-0.5 text-slate-500 opacity-0 transition hover:text-slate-200 group-hover:opacity-100`}
                        onClick={() =>
                          setPickerOpen(pickerOpen === msg.id ? null : msg.id)
                        }
                        aria-label="Add reaction"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path
                            d="M8 14s1.5 2 4 2 4-2 4-2"
                            strokeLinecap="round"
                          />
                          <path d="M9 9h.01M15 9h.01" strokeLinecap="round" />
                        </svg>
                      </button>
                      {pickerOpen === msg.id && (
                        <div
                          className={`absolute -top-10 ${isMe ? "right-0" : "left-0"} z-20`}
                        >
                          <ReactionPicker
                            onPick={(e) => toggleReaction(msg.id, e)}
                          />
                        </div>
                      )}
                    </div>

                    {/* Reactions */}
                    {hasReactions && (
                      <div
                        className={`flex flex-wrap gap-1 ${isMe ? "justify-end" : ""}`}
                      >
                        {Object.entries(msgReactions).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            className="inline-flex items-center gap-0.5 rounded-full border border-slate-600/80 bg-slate-800 px-1.5 py-0.5 text-xs hover:border-cyan-400/40 hover:bg-slate-700 transition"
                            onClick={() => toggleReaction(msg.id, emoji)}
                            title={`${count} reaction(s)`}
                          >
                            {emoji}{" "}
                            <span className="text-slate-300">{count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-800 px-4 py-3">
        <div className="relative flex items-end gap-2">
          {mentionFilter !== null && (
            <MentionDropdown
              members={members}
              filter={mentionFilter}
              onSelect={handleMentionSelect}
            />
          )}
          <input
            ref={inputRef}
            className="input-modern flex-1 !py-2.5"
            value={message}
            placeholder={
              canChat
                ? "Type a message… Use @name to mention"
                : "Chat permission denied"
            }
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={!canChat}
          />
          <button
            className="btn-primary shrink-0 !px-3.5 !py-2.5"
            onClick={sendMessage}
            disabled={!canChat}
            aria-label="Send message"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M22 2L11 13"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22 2L15 22l-4-9-9-4 20-7z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Files strip */}
      {files.length > 0 && (
        <div className="border-t border-slate-800 bg-slate-900/40 px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Project Files
          </p>
          <div className="flex flex-wrap gap-2">
            {files.map((f) => (
              <a
                key={f.id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/70 px-2.5 py-1 text-xs text-cyan-300 transition hover:border-cyan-400/50 hover:text-cyan-200"
                href={`http://localhost:5000/${f.filepath}`}
                target="_blank"
                rel="noreferrer"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                  <polyline points="13 2 13 9 20 9" />
                </svg>
                {f.filename}
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
