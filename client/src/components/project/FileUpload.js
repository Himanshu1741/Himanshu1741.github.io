import { useEffect, useRef, useState } from "react";
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
  const [isDragging, setIsDragging] = useState(false);

  const fileInputMultipleRef = useRef(null);
  const fileInputFolderRef = useRef(null);
  const dropZoneRef = useRef(null);

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

  // Debug: Check file input attributes
  useEffect(() => {
    console.log("📋 Checking file input attributes:");

    if (fileInputMultipleRef.current) {
      const input = fileInputMultipleRef.current;
      console.log("  Multiple Files Input:");
      console.log("    - multiple:", input.hasAttribute("multiple"));
      console.log("    - accept:", input.getAttribute("accept"));
      console.log("    - type:", input.getAttribute("type"));
      console.log(
        "    - webkitdirectory:",
        input.hasAttribute("webkitdirectory"),
      );
    }

    if (fileInputFolderRef.current) {
      const input = fileInputFolderRef.current;
      console.log("  Folder Input:");
      console.log(
        "    - webkitdirectory:",
        input.hasAttribute("webkitdirectory"),
      );
      console.log("    - mozdirectory:", input.hasAttribute("mozdirectory"));
      console.log("    - type:", input.getAttribute("type"));
      console.log("    - multiple:", input.hasAttribute("multiple"));
      console.log("    - element id:", input.id);
      console.log("    - element name:", input.name);
    }

    // Check browser support for webkitdirectory
    const testInput = document.createElement("input");
    testInput.type = "file";
    testInput.webkitdirectory = true;
    const supportsFolderUpload = testInput.hasAttribute("webkitdirectory");
    console.log("🌐 Browser folder upload support:", supportsFolderUpload);
  }, [uploadMode]);

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
    console.log("🚀 Upload clicked");
    console.log("Selected files:", selectedFiles.length);
    console.log("Upload mode:", uploadMode);
    console.log("Can manage files:", canManageFiles);
    console.log("Project ID:", projectId);

    if (selectedFiles.length === 0) {
      alert("❌ Please select files first");
      return;
    }
    if (!canManageFiles) {
      alert("❌ File management permission denied");
      return;
    }
    if (!projectId) {
      alert("❌ Error: Project ID is missing");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("project_id", projectId);

      console.log("📦 Adding files to FormData:");
      selectedFiles.forEach((file, index) => {
        console.log(`  [${index + 1}] ${file.name} (${file.size} bytes)`);
        formData.append("files", file);
      });

      console.log("🌐 Sending POST request to /api/files");
      console.log("API Base URL:", API.defaults.baseURL);
      console.log("FormData keys:", Array.from(formData.keys()));

      const response = await API.post("/files", formData);

      console.log("✅ Upload successful!");
      console.log("Response:", response.data);

      await loadFiles();
      setSelectedFiles([]);

      if (fileInputMultipleRef.current) fileInputMultipleRef.current.value = "";
      if (fileInputFolderRef.current) fileInputFolderRef.current.value = "";

      alert(`✅ Successfully uploaded ${selectedFiles.length} file(s)`);
    } catch (error) {
      console.error("❌ Upload FAILED");
      console.error("Error object:", error);
      console.error("Error code:", error.code);
      console.error("Status:", error.response?.status);
      console.error("Response data:", error.response?.data);
      console.error("Message:", error.message);
      console.error("API Base URL:", API.defaults.baseURL);

      let errorMsg = "Upload failed - check browser console";

      if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
        errorMsg = `❌ Network Error: Cannot connect to server at ${API.defaults.baseURL}. Ensure the backend server is running on port 5000.`;
      } else {
        errorMsg =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          errorMsg;
      }

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
    const input = e.target;
    const isFolderMode =
      uploadMode === "folder" || input.hasAttribute("webkitdirectory");

    console.log("📁 File input triggered");
    console.log("Upload mode:", uploadMode);
    console.log("Is folder mode:", isFolderMode);
    console.log("Files in input:", fileList?.length || 0);

    // Debug: Check input attributes
    console.log("Input element attributes:");
    console.log("  - multiple:", input.hasAttribute("multiple"));
    console.log("  - webkitdirectory:", input.hasAttribute("webkitdirectory"));
    console.log("  - mozdirectory:", input.hasAttribute("mozdirectory"));
    console.log("  - type:", input.getAttribute("type"));
    console.log("  - element id:", input.id);

    if (fileList && fileList.length > 0) {
      const filesArray = Array.from(fileList);
      console.log(`✅ Selected ${filesArray.length} file(s)`);
      if (isFolderMode) {
        console.log("📂 Folder contents:");
      }
      filesArray.forEach((f) => {
        const path = f.webkitRelativePath || f.name;
        console.log(`  - ${path} (${f.size} bytes)`);
      });
      setSelectedFiles(filesArray);
    } else {
      console.log("⚠️ No files selected");
      console.log("💡 Folder selection might not be supported in your browser");
      console.log(
        "   Supported browsers: Chrome, Edge, Firefox (with mozdirectory)",
      );
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const clearSelection = () => {
    console.log("🧹 Clearing file selection");
    setSelectedFiles([]);

    if (fileInputMultipleRef.current) {
      fileInputMultipleRef.current.value = "";
      console.log("  ✓ Cleared multiple files input");
    }
    if (fileInputFolderRef.current) {
      fileInputFolderRef.current.value = "";
      console.log("  ✓ Cleared folder input");
    }
  };

  const handleFolderButtonClick = () => {
    console.log("📁 Folder button clicked");
    console.log("Switching to Folder mode");
    setUploadMode("folder");
    clearSelection();

    // Trigger folder input click after a brief delay to ensure state update
    setTimeout(() => {
      console.log("🖱️ Attempting to click folder input");
      if (fileInputFolderRef.current) {
        fileInputFolderRef.current.click();
        console.log("✅ Folder input clicked");
      } else {
        console.warn("⚠️ Folder input ref not found");
      }
    }, 100);
  };

  const handleMultipleButtonClick = () => {
    console.log("📄 Multiple files button clicked");
    console.log("Switching to Multiple Files mode");
    setUploadMode("files");
    clearSelection();

    // Trigger multiple files input click after state update
    setTimeout(() => {
      console.log("🖱️ Attempting to click multiple files input");
      if (fileInputMultipleRef.current) {
        fileInputMultipleRef.current.click();
        console.log("✅ Multiple files input clicked");
      } else {
        console.warn("⚠️ Multiple files input ref not found");
      }
    }, 100);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    console.log("🎯 Drag over drop zone");
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set isDragging to false if we're leaving the drop zone container
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false);
      console.log("👋 Drag left drop zone");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    console.log("📥 Files dropped");
    const droppedItems = e.dataTransfer.items;

    if (!droppedItems) {
      console.warn("⚠️ No items in drop event");
      return;
    }

    // Collect files from dropped items (handles folders and files)
    const droppedFiles = [];
    let folderCount = 0;

    for (let i = 0; i < droppedItems.length; i++) {
      const item = droppedItems[i];

      if (item.kind === "file") {
        const entry = item.webkitGetAsEntry?.();

        if (entry?.isDirectory) {
          folderCount++;
          console.log(`📂 Folder detected: ${entry.name}`);
          // For directory drops, we'll collect all files in it
          collectFilesFromDir(entry, droppedFiles);
        } else {
          const file = item.getAsFile();
          if (file) {
            droppedFiles.push(file);
            console.log(`📄 File: ${file.name} (${file.size} bytes)`);
          }
        }
      }
    }

    if (droppedFiles.length > 0) {
      console.log(`✅ Dropped ${droppedFiles.length} file(s)`);
      if (folderCount > 0) {
        setUploadMode("folder");
        console.log(
          `📁 Switched to folder upload mode (${folderCount} folder)`,
        );
      }
      setSelectedFiles(droppedFiles);
    } else {
      console.warn("⚠️ No files found in drop");
    }
  };

  // Recursively collect files from directory
  const collectFilesFromDir = async (dirEntry, fileList) => {
    const reader = dirEntry.createReader();

    return new Promise((resolve) => {
      const readEntries = () => {
        reader.readEntries((entries) => {
          if (entries.length === 0) {
            resolve();
            return;
          }

          entries.forEach((entry) => {
            if (entry.isDirectory) {
              collectFilesFromDir(entry, fileList);
            } else if (entry.isFile) {
              entry.file((file) => {
                fileList.push(file);
                console.log(`  ├─ ${entry.fullPath} (${file.size} bytes)`);
              });
            }
          });

          readEntries();
        });
      };

      readEntries();
    });
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
        {/* Upload Mode Toggle Buttons - ALWAYS VISIBLE */}
        <div
          className="mb-4"
          style={{ display: "block", visibility: "visible" }}
        >
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              type="button"
              name="upload-mode-files"
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition cursor-pointer ${
                uploadMode === "files"
                  ? "bg-cyan-500 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
              onClick={handleMultipleButtonClick}
            >
              📄 Multiple Files
            </button>
            <button
              type="button"
              name="upload-mode-folder"
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition cursor-pointer ${
                uploadMode === "folder"
                  ? "bg-cyan-500 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
              onClick={handleFolderButtonClick}
            >
              📁 Upload Folder
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            {uploadMode === "files"
              ? "Select one or more files"
              : "Select a folder with files inside"}
          </p>
        </div>

        {/* File Input Section with Drag & Drop */}
        <div className="mb-4">
          <div
            ref={dropZoneRef}
            className={`border-2 border-dashed rounded-lg p-4 transition ${
              isDragging
                ? "border-cyan-500 bg-cyan-500/10 bg-opacity-20"
                : "border-slate-600 bg-slate-900/50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-center">
              {isDragging && (
                <div className="mb-3 text-cyan-400 font-semibold animate-pulse">
                  📥 Drop files or folders here
                </div>
              )}
              {uploadMode === "files" && (
                <input
                  ref={fileInputMultipleRef}
                  key="multiple-files-input"
                  id="file-input-main"
                  name="files-input"
                  className="w-full cursor-pointer"
                  type="file"
                  onChange={handleFileSelection}
                  multiple={true}
                  accept="*/*"
                  disabled={isUploading}
                />
              )}
              {uploadMode === "folder" && (
                <input
                  ref={fileInputFolderRef}
                  key="folder-input"
                  id="file-input-folder"
                  name="folder-input"
                  className="w-full cursor-pointer"
                  type="file"
                  onChange={handleFileSelection}
                  webkitdirectory
                  mozdirectory
                  multiple={true}
                  disabled={isUploading}
                />
              )}
              {!isDragging && (
                <p className="text-xs text-slate-400 mt-2">
                  💡 Or drag and drop{" "}
                  {uploadMode === "files" ? "files" : "a folder"} here
                </p>
              )}
            </div>
          </div>

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
