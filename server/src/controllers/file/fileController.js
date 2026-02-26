const File = require("../../models/File");
const ProjectMember = require("../../models/ProjectMember");
const Project = require("../../models/Project");
const sequelize = require("../../config/db");
const fs = require("fs");
const path = require("path");

let fileTrashTableReady = false;

const ensureFileTrashTable = async () => {
  if (fileTrashTableReady) return;

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS file_trash (
      id INT AUTO_INCREMENT PRIMARY KEY,
      file_id INT NOT NULL,
      filename VARCHAR(255) NULL,
      filepath VARCHAR(255) NULL,
      project_id INT NOT NULL,
      uploaded_by INT NULL,
      deleted_by INT NOT NULL,
      deleted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_file_trash_project_id (project_id),
      INDEX idx_file_trash_deleted_at (deleted_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  fileTrashTableReady = true;
};

const uploadsRoot = path.resolve(__dirname, "..", "..", "uploads");
const fileTrashRoot = path.join(uploadsRoot, ".trash");

const resolveFromProjectRoot = (relativePath) => path.resolve(__dirname, "..", "..", relativePath || "");

exports.uploadFile = async (req, res) => {
  try {
    const { project_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No file selected" });
    }

    const membership = await ProjectMember.findOne({
      where: {
        project_id,
        user_id: req.user.id
      }
    });

    if (!membership) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (!membership.can_manage_files) {
      return res.status(403).json({ message: "File management permission denied" });
    }

    const file = await File.create({
      filename: req.file.filename,
      filepath: req.file.path,
      project_id,
      uploaded_by: req.user.id
    });

    res.json({ message: "File uploaded successfully", file });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getFilesByProject = async (req, res) => {
  try {
    const { project_id } = req.params;

    const membership = await ProjectMember.findOne({
      where: {
        project_id,
        user_id: req.user.id
      }
    });

    if (!membership) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const files = await File.findAll({
      where: { project_id }
    });

    res.json(files);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const { id } = req.params;

    const file = await File.findByPk(id);
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    const membership = await ProjectMember.findOne({
      where: {
        project_id: file.project_id,
        user_id: req.user.id
      }
    });

    if (!membership) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (!membership.can_manage_files) {
      return res.status(403).json({ message: "File management permission denied" });
    }

    if (file.uploaded_by !== req.user.id) {
      return res.status(403).json({ message: "Only uploader can delete this file" });
    }

    await ensureFileTrashTable();

    let trashedPath = file.filepath || null;
    const sourceAbsolutePath = resolveFromProjectRoot(file.filepath || "");

    if (file.filepath && fs.existsSync(sourceAbsolutePath)) {
      fs.mkdirSync(fileTrashRoot, { recursive: true });
      const trashName = `${Date.now()}-${path.basename(file.filepath)}`;
      const destinationAbsolutePath = path.join(fileTrashRoot, trashName);
      fs.renameSync(sourceAbsolutePath, destinationAbsolutePath);
      trashedPath = path.relative(path.resolve(__dirname, "..", ".."), destinationAbsolutePath).replace(/\\/g, "/");
    }

    await sequelize.query(
      `
        INSERT INTO file_trash
          (file_id, filename, filepath, project_id, uploaded_by, deleted_by)
        VALUES
          (?, ?, ?, ?, ?, ?)
      `,
      {
        replacements: [
          file.id,
          file.filename || null,
          trashedPath,
          file.project_id,
          file.uploaded_by || null,
          req.user.id
        ]
      }
    );

    await file.destroy();

    return res.json({ message: "File moved to trash successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const { id } = req.params;

    const file = await File.findByPk(id);
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    const membership = await ProjectMember.findOne({
      where: {
        project_id: file.project_id,
        user_id: req.user.id
      }
    });

    if (!membership) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const uploadsDir = path.resolve(__dirname, "..", "..", "uploads");
    const absolutePath = path.resolve(__dirname, "..", "..", file.filepath || "");

    if (!absolutePath.startsWith(uploadsDir)) {
      return res.status(400).json({ message: "Invalid file path" });
    }

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: "File missing on server" });
    }

    return res.download(absolutePath, file.filename || path.basename(absolutePath));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getDeletedFilesByProject = async (req, res) => {
  try {
    const { project_id } = req.params;

    const project = await Project.findByPk(project_id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.created_by !== req.user.id) {
      return res.status(403).json({ message: "Only the project creator can view file trash" });
    }

    await ensureFileTrashTable();

    const [rows] = await sequelize.query(
      `
        SELECT id, file_id, filename, filepath, project_id, uploaded_by, deleted_by, deleted_at
        FROM file_trash
        WHERE project_id = ?
        ORDER BY deleted_at DESC
      `,
      { replacements: [project_id] }
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.restoreFile = async (req, res) => {
  try {
    const { id } = req.params;

    await ensureFileTrashTable();

    const [rows] = await sequelize.query(
      `SELECT * FROM file_trash WHERE id = ? LIMIT 1`,
      { replacements: [id] }
    );
    const trashedFile = rows?.[0];

    if (!trashedFile) {
      return res.status(404).json({ message: "Trashed file not found" });
    }

    const project = await Project.findByPk(trashedFile.project_id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.created_by !== req.user.id) {
      return res.status(403).json({ message: "Only the project creator can restore files" });
    }

    const originalRelativePath = `uploads/${trashedFile.filename}`;
    let finalRelativePath = originalRelativePath;

    if (trashedFile.filepath) {
      const trashAbsolutePath = resolveFromProjectRoot(trashedFile.filepath);
      if (fs.existsSync(trashAbsolutePath)) {
        fs.mkdirSync(uploadsRoot, { recursive: true });
        let destinationAbsolutePath = resolveFromProjectRoot(originalRelativePath);
        if (fs.existsSync(destinationAbsolutePath)) {
          const ext = path.extname(trashedFile.filename || "");
          const base = path.basename(trashedFile.filename || "file", ext);
          const renamed = `${base}-${Date.now()}${ext}`;
          finalRelativePath = `uploads/${renamed}`;
          destinationAbsolutePath = resolveFromProjectRoot(finalRelativePath);
        }
        fs.renameSync(trashAbsolutePath, destinationAbsolutePath);
      } else {
        return res.status(404).json({ message: "Deleted file content is missing on server" });
      }
    }

    const restoredFile = await File.create({
      filename: path.basename(finalRelativePath),
      filepath: finalRelativePath,
      project_id: trashedFile.project_id,
      uploaded_by: trashedFile.uploaded_by || req.user.id
    });

    await sequelize.query(
      `DELETE FROM file_trash WHERE id = ?`,
      { replacements: [id] }
    );

    return res.json({ message: "File restored successfully", file: restoredFile });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteFilePermanently = async (req, res) => {
  try {
    const { id } = req.params;

    await ensureFileTrashTable();

    const [rows] = await sequelize.query(
      `SELECT id, project_id, filepath FROM file_trash WHERE id = ? LIMIT 1`,
      { replacements: [id] }
    );
    const trashedFile = rows?.[0];

    if (!trashedFile) {
      return res.status(404).json({ message: "Trashed file not found" });
    }

    const project = await Project.findByPk(trashedFile.project_id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.created_by !== req.user.id) {
      return res.status(403).json({ message: "Only the project creator can permanently delete files" });
    }

    if (trashedFile.filepath) {
      const absolutePath = resolveFromProjectRoot(trashedFile.filepath);
      if (absolutePath.startsWith(fileTrashRoot) && fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    }

    await sequelize.query(
      `DELETE FROM file_trash WHERE id = ?`,
      { replacements: [id] }
    );

    return res.json({ message: "File permanently deleted from trash" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
