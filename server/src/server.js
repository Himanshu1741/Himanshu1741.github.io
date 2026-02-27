require("dotenv").config();
const express = require("express");
const cors = require("cors");
const passport = require("./config/passport");
const sequelize = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const taskCommentRoutes = require("./routes/taskCommentRoutes");
const milestoneRoutes = require("./routes/milestoneRoutes");
const timeLogRoutes = require("./routes/timeLogRoutes");
const searchRoutes = require("./routes/searchRoutes");
const messageRoutes = require("./routes/messageRoutes");
const fileRoutes = require("./routes/fileRoutes");
const adminRoutes = require("./routes/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const Message = require("./models/Message");
const MessageReaction = require("./models/MessageReaction");
const User = require("./models/User");
const ProjectMember = require("./models/ProjectMember");
const Notification = require("./models/Notification");

const http = require("http");
const { Server } = require("socket.io");

const path = require("path");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/task-comments", taskCommentRoutes);
app.use("/api/milestones", milestoneRoutes);
app.use("/api/time-logs", timeLogRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);

// Serve uploaded files (absolute path — works regardless of cwd)
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Database Connection
sequelize
  .authenticate()
  .then(() => console.log("✅ Database Connected"))
  .catch((err) => console.log("❌ DB Error:", err));

/* =========================
   SOCKET.IO LOGIC
========================= */

io.on("connection", (socket) => {
  console.log("🔌 User Connected:", socket.id);

  socket.on("registerUser", (userId) => {
    socket.join(String(userId));
  });

  // Join project room
  socket.on("joinProject", (projectId) => {
    const roomId = String(projectId);
    socket.join(roomId);
    console.log(`User joined project room ${roomId}`);
  });

  socket.on("leaveProject", (projectId) => {
    const roomId = String(projectId);
    socket.leave(roomId);
  });

  socket.on("sendNotification", (data) => {
    io.to(data.userId).emit("receiveNotification", data);
  });

  // Toggle message reaction
  socket.on("toggleReaction", async (data) => {
    try {
      // data: { messageId, userId, emoji, projectId }
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS message_reactions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          message_id INT NOT NULL,
          user_id INT NOT NULL,
          emoji VARCHAR(16) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_reaction (message_id, user_id, emoji),
          INDEX idx_mr_message_id (message_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      const [existing] = await sequelize.query(
        `SELECT id FROM message_reactions WHERE message_id=? AND user_id=? AND emoji=? LIMIT 1`,
        { replacements: [data.messageId, data.userId, data.emoji] },
      );

      if (existing.length > 0) {
        await sequelize.query(
          `DELETE FROM message_reactions WHERE message_id=? AND user_id=? AND emoji=?`,
          { replacements: [data.messageId, data.userId, data.emoji] },
        );
      } else {
        await sequelize.query(
          `INSERT IGNORE INTO message_reactions (message_id, user_id, emoji) VALUES (?,?,?)`,
          { replacements: [data.messageId, data.userId, data.emoji] },
        );
      }

      // Fetch updated reactions for that message
      const [reactions] = await sequelize.query(
        `SELECT emoji, COUNT(*) AS count, GROUP_CONCAT(user_id) AS user_ids
         FROM message_reactions WHERE message_id=? GROUP BY emoji`,
        { replacements: [data.messageId] },
      );

      io.to(String(data.projectId)).emit("reactionsUpdated", {
        messageId: data.messageId,
        reactions,
      });
    } catch (err) {
      console.error("Reaction error:", err.message);
    }
  });

  socket.on("sendMessage", async (data) => {
    try {
      // Check for @mentions in message
      const mentionedNames = [];
      const mentionRegex = /@(\w+)/g;
      let match;
      while ((match = mentionRegex.exec(data.content || "")) !== null) {
        mentionedNames.push(match[1].toLowerCase());
      }

      const senderMembership = await ProjectMember.findOne({
        where: {
          project_id: data.projectId,
          user_id: data.senderId,
        },
      });

      if (!senderMembership) {
        socket.emit("chatError", { message: "Not a project member" });
        return;
      }

      if (!senderMembership.can_chat) {
        socket.emit("chatError", { message: "Chat permission denied" });
        return;
      }

      const sender = await User.findByPk(data.senderId, {
        attributes: ["id", "name"],
      });

      // Save to DB
      const savedMessage = await Message.create({
        content: data.content,
        project_id: data.projectId,
        sender_id: data.senderId,
      });

      // Broadcast to project room with sender name
      io.to(String(data.projectId)).emit("receiveMessage", {
        ...savedMessage.toJSON(),
        sender_name: sender?.name || "Unknown",
      });

      // Create notifications for all project members except the sender.
      const members = await ProjectMember.findAll({
        where: { project_id: data.projectId },
        attributes: ["user_id"],
      });

      const recipientIds = members
        .map((member) => member.user_id)
        .filter((userId) => Number(userId) !== Number(data.senderId));

      if (recipientIds.length > 0) {
        const senderName = sender?.name || "A team member";
        const rawMessage = String(savedMessage.content || "").trim();
        const preview =
          rawMessage.length > 120
            ? `${rawMessage.slice(0, 117)}...`
            : rawMessage;
        const notificationMessage = `[Project ${data.projectId}] ${senderName}: ${preview || "(no message text)"}`;

        for (const userId of recipientIds) {
          const notification = await Notification.create({
            message: notificationMessage,
            user_id: userId,
          });
          io.to(String(userId)).emit(
            "receiveNotification",
            notification.toJSON(),
          );
        }
      }

      // Handle @mentions — create targeted notifications and send emails
      if (mentionedNames.length > 0) {
        try {
          const { sendMentionEmail } = require("./services/emailService");
          const Project = require("./models/Project");
          const allMembers = await ProjectMember.findAll({
            where: { project_id: data.projectId },
          });
          const memberUserIds = allMembers
            .map((m) => m.user_id)
            .filter((uid) => uid !== data.senderId);
          const memberUsers = await User.findAll({
            where: { id: memberUserIds },
            attributes: ["id", "name", "email"],
          });
          const project = await Project.findByPk(data.projectId, {
            attributes: ["id", "title"],
          });
          const senderNameStr = sender?.name || "A team member";
          const preview = String(savedMessage.content || "").slice(0, 200);

          for (const mentionedNameRaw of mentionedNames) {
            const mentionedUser = memberUsers.find(
              (u) =>
                u.name.toLowerCase().replace(/\s+/g, "") ===
                mentionedNameRaw.toLowerCase(),
            );
            if (mentionedUser) {
              const mentionNotif = await Notification.create({
                message: `[Project ${data.projectId}] ${senderNameStr} mentioned you: ${preview}`,
                user_id: mentionedUser.id,
              });
              io.to(String(mentionedUser.id)).emit(
                "receiveNotification",
                mentionNotif.toJSON(),
              );
              await sendMentionEmail({
                toEmail: mentionedUser.email,
                toName: mentionedUser.name,
                mentionedBy: senderNameStr,
                projectTitle: project?.title || `Project ${data.projectId}`,
                messagePreview: preview,
              });
            }
          }
        } catch (mentionErr) {
          console.error("Mention handling error:", mentionErr.message);
        }
      }
    } catch (error) {
      console.log("Message Save Error:", error.message);
    }
  });

  socket.on("disconnect", (reason) => {
    const expectedDisconnectReasons = new Set([
      "transport close",
      "transport error",
      "ping timeout",
      "client namespace disconnect",
      "server namespace disconnect",
    ]);

    if (expectedDisconnectReasons.has(reason)) {
      console.log(`ℹ️ User disconnected: ${socket.id} (${reason})`);
      return;
    }

    console.warn(
      `⚠️ Unexpected disconnect: ${socket.id} (${reason || "unknown reason"})`,
    );
  });
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.log(
      `⚠️ Port ${process.env.PORT} is already in use. Backend is likely already running.`,
    );
    process.exit(0);
  }
  throw error;
});

server.listen(process.env.PORT, () =>
  console.log(`🚀 Server running on port ${process.env.PORT}`),
);
