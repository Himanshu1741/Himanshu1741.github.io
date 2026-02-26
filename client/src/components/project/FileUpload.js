import { useState, useEffect } from "react";
import API from "../../services/api";
import FilePreview from "./FilePreview";

export default function FileUpload({ projectId }) {
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [userId, setUserId] = useState(null);
  const [canManageFiles, setCanManageFiles] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);

  const loadFiles = async () => {
    const res = await API.get(`/files/${projectId}`);
    setFiles(res.data);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserId(parsed.id);
      } catch {
        setUserId(null);
      }
    }
    loadFiles();
  }, [projectId]);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const res = await API.get(`/projects/${projectId}/permissions`);
        setCanManageFiles(Boolean(res.data?.permissions?.can_manage_files));
      } catch {
        setCanManageFiles(false);
      }
    };

    loadPermissions();
  }, [projectId]);

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first");
      return;
    }
    if (!canManageFiles) {
      alert("File management permission denied");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("project_id", projectId);

    await API.post("/files", formData);
    await loadFiles();
    setFile(null);
  };

  const handleDelete = async (fileId) => {
    try {
      await API.delete(`/files/${fileId}`);
      await loadFiles();
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to delete file");
    }
  };

  const handleDownload = async (selectedFile) => {
    try {
      const res = await API.get(`/files/${selectedFile.id}/download`, {
        responseType: "blob"
      });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = selectedFile.filename || "project-file";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to download file");
    }
  };

  return (
    <section className="panel-card mb-6 p-5">
      {previewFile && <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />}
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-white">Project Files</h3>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">{files.length} files</span>
      </div>

      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center">
        <input
          className="input-modern file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-100 hover:file:bg-slate-600"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button className="btn-primary md:w-auto" onClick={handleUpload} disabled={!canManageFiles}>
          <span className="inline-flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 16V4" strokeLinecap="round" />
              <path d="M7 9l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 20h16" strokeLinecap="round" />
            </svg>
            Upload
          </span>
        </button>
      </div>

      <div className="space-y-2">
        {files.map((f) => (
          <div key={f.id} className="surface-soft p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                className="break-all text-left text-cyan-300 hover:text-cyan-200 hover:underline"
                onClick={() => setPreviewFile(f)}
              >
                {f.filename}
              </button>
              <div className="flex w-full gap-2 sm:w-auto sm:flex-row sm:items-center">
                {/* Preview button */}
                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-600 bg-slate-800/80 text-slate-100 transition hover:-translate-y-px hover:bg-slate-700"
                  onClick={() => setPreviewFile(f)}
                  aria-label={`Preview ${f.filename}`}
                  title="Preview"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-600 bg-slate-800/80 text-slate-100 transition hover:-translate-y-px hover:bg-slate-700"
                  onClick={() => handleDownload(f)}
                  aria-label={`Download ${f.filename}`}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 10l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {userId && f.uploaded_by === userId && canManageFiles ? (
                  <button
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/90 text-white transition hover:-translate-y-px hover:bg-rose-500"
                    onClick={() => handleDelete(f.id)}
                    aria-label={`Delete ${f.filename}`}
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8 6V4h8v2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
