import { useEffect, useState } from "react";
import API from "../../services/api";
import FilePreview from "./FilePreview";

export default function FileUpload({ projectId }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [files, setFiles] = useState([]);
  const [userId, setUserId] = useState(null);
  const [canManageFiles, setCanManageFiles] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);
  const [uploadMode, setUploadMode] = useState("files");
  const [isUploading, setIsUploading] = useState(false);

  const loadFiles = async () => {
    try {
      const res = await API.get(`/files/${projectId}`);
      setFiles(res.data);
    } catch (error) {
      console.error("Error loading files:", error.message);
    }
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
    if (selectedFiles.length === 0) {
      alert("Please select files first");
      return;
    }
    if (!canManageFiles) {
      alert("File management permission denied");
      return;
    }
    if (!projectId) {
      alert("Error: Project ID is missing");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("project_id", projectId);

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      console.log("📤 Uploading", selectedFiles.length, "file(s)...");

      const response = await API.post("/files", formData);

      console.log("✅ Upload successful:", response.data);
      await loadFiles();
      setSelectedFiles([]);

      const fileInputMain = document.getElementById("file-input-main");
      const fileInputFolder = document.getElementById("file-input-folder");
      if (fileInputMain) fileInputMain.value = "";
      if (fileInputFolder) fileInputFolder.value = "";

      alert(`✅ Successfully uploaded ${selectedFiles.length} file(s)`);
    } catch (error) {
      console.error("❌ Upload error:");
      console.error("  Status:", error.response?.status);
      console.error("  Message:", error.response?.data?.message);
      console.error("  Error:", error.response?.data?.error);

      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Upload failed";
      alert(errorMsg);
    } finally {
      setIsUploading(false);
    }
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
        responseType: "blob",
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

  const handleFileSelection = (e) => {
    const fileList = e.target.files;
    if (fileList && fileList.length > 0) {
      const filesArray = Array.from(fileList);
      console.log(`✅ Selected ${filesArray.length} file(s)`);
      filesArray.forEach((f) => console.log(`  - ${f.name} (${f.size} bytes)`));
      setSelectedFiles(filesArray);
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const clearSelection = () => {
    setSelectedFiles([]);
    const fileInputMain = document.getElementById("file-input-main");
    const fileInputFolder = document.getElementById("file-input-folder");
    if (fileInputMain) fileInputMain.value = "";
    if (fileInputFolder) fileInputFolder.value = "";
  };

  return (
    <section className="panel-card mb-6 p-5">
      {previewFile && (
        <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-white">Project Files</h3>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">
          {files.length} files
        </span>
      </div>

      <div className="mb-4">
        <div className="mb-4 flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-800 bg-slate-900/60 p-1 gap-1">
            <button
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                uploadMode === "files"
                  ? "bg-cyan-500/20 text-cyan-300"
                  : "text-slate-500 hover:text-slate-300"
              }`}
              onClick={() => {
                setUploadMode("files");
                clearSelection();
              }}
            >
              📄 Multiple Files
            </button>
            <button
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                uploadMode === "folder"
                  ? "bg-cyan-500/20 text-cyan-300"
                  : "text-slate-500 hover:text-slate-300"
              }`}
              onClick={() => {
                setUploadMode("folder");
                clearSelection();
              }}
            >
              📁 Upload Folder
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {uploadMode === "files" ? (
            <input
              id="file-input-main"
              className="input-modern file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-100 hover:file:bg-slate-600"
              type="file"
              onChange={handleFileSelection}
              multiple
              accept="*/*"
              disabled={isUploading}
            />
          ) : (
            <input
              id="file-input-folder"
              className="input-modern file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-100 hover:file:bg-slate-600"
              type="file"
              onChange={handleFileSelection}
              webkitdirectory=""
              mozdirectory=""
              disabled={isUploading}
            />
          )}

          {selectedFiles.length > 0 && (
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
              <div className="mb-2 text-sm text-slate-300">
                {selectedFiles.length} file(s) selected
              </div>
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg bg-slate-800/50 px-2.5 py-1.5 text-xs"
                  >
                    <span className="truncate text-slate-300">{file.name}</span>
                    <button
                      type="button"
                      className="ml-2 text-slate-500 hover:text-rose-400"
                      onClick={() => removeSelectedFile(index)}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              className="btn-primary md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleUpload}
              disabled={
                !canManageFiles || selectedFiles.length === 0 || isUploading
              }
            >
              <span className="inline-flex items-center gap-2">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 16V4" strokeLinecap="round" />
                  <path
                    d="M7 9l5-5 5 5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M4 20h16" strokeLinecap="round" />
                </svg>
                {isUploading ? "Uploading..." : "Upload"}
              </span>
            </button>
            {selectedFiles.length > 0 && (
              <button
                className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition disabled:opacity-50"
                onClick={clearSelection}
                disabled={isUploading}
              >
                Clear
              </button>
            )}
          </div>
        </div>
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
              <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap sm:items-center">
                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-600 bg-slate-800/80 text-slate-100 transition hover:-translate-y-px hover:bg-slate-700"
                  onClick={() => setPreviewFile(f)}
                  aria-label={`Preview ${f.filename}`}
                  title="Preview"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-600 bg-slate-800/80 text-slate-100 transition hover:-translate-y-px hover:bg-slate-700"
                  onClick={() => handleDownload(f)}
                  aria-label={`Download ${f.filename}`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="M12 3v12"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7 15l5 5 5-5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path d="M4 20h16" strokeLinecap="round" />
                  </svg>
                </button>
                {userId === f.uploaded_by && (
                  <button
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-600 bg-slate-800/80 text-slate-100 transition hover:-translate-y-px hover:bg-rose-700/50 hover:border-rose-600"
                    onClick={() => handleDelete(f.id)}
                    aria-label={`Delete ${f.filename}`}
                    title="Delete"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
