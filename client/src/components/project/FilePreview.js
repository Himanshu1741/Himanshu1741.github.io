import { useEffect, useRef } from "react";

const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"];
const PDF_EXTS = ["pdf"];

function getExt(filename = "") {
  return filename.split(".").pop().toLowerCase();
}

export default function FilePreview({ file, onClose }) {
  const overlayRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!file) return null;

  const ext = getExt(file.filename || file.filepath);
  const url = `http://localhost:5000/${file.filepath}`;
  const isImage = IMAGE_EXTS.includes(ext);
  const isPdf = PDF_EXTS.includes(ext);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
          <p className="truncate text-sm font-medium text-slate-200">{file.filename}</p>
          <button
            className="ml-2 flex-shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            onClick={onClose}
            aria-label="Close preview"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 items-center justify-center overflow-auto p-4">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={file.filename}
              className="max-h-[75vh] max-w-full rounded-lg object-contain"
            />
          ) : isPdf ? (
            <iframe
              src={url}
              title={file.filename}
              className="h-[75vh] w-full rounded-lg border-0"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 py-12 text-slate-400">
              <svg viewBox="0 0 24 24" className="h-16 w-16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <p className="text-sm">Preview not available for this file type.</p>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="btn-primary text-sm"
              >
                Download / Open File
              </a>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-800 px-5 py-3">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary text-xs"
          >
            Open in New Tab
          </a>
          <a
            href={url}
            download={file.filename}
            className="btn-primary text-xs"
          >
            Download
          </a>
        </div>
      </div>
    </div>
  );
}
