CREATE DATABASE IF NOT EXISTS student_collab_hub;

USE student_collab_hub;

CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expiry` datetime DEFAULT NULL,
  `role` enum('admin','member') DEFAULT 'member',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `github_repo` varchar(255) DEFAULT NULL,
  `status` enum('active','completed') DEFAULT 'active',
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_projects_created_by` (`created_by`),
  CONSTRAINT `fk_projects_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `project_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `user_id` int NOT NULL,
  `can_manage_tasks` tinyint(1) DEFAULT '1',
  `can_manage_files` tinyint(1) DEFAULT '1',
  `can_chat` tinyint(1) DEFAULT '1',
  `can_change_project_name` tinyint(1) DEFAULT '0',
  `can_add_members` tinyint(1) DEFAULT '0',
  `member_role` varchar(30) DEFAULT 'member',
  PRIMARY KEY (`id`),
  KEY `idx_project_members_project_id` (`project_id`),
  KEY `idx_project_members_user_id` (`user_id`),
  CONSTRAINT `fk_project_members_project_id` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_project_members_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `project_id` int NOT NULL,
  `assigned_to` int DEFAULT NULL,
  `status` enum('todo','in_progress','completed') DEFAULT 'todo',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tasks_project_id` (`project_id`),
  KEY `idx_tasks_assigned_to` (`assigned_to`),
  CONSTRAINT `fk_tasks_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_tasks_project_id` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sender_id` int NOT NULL,
  `project_id` int NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_messages_project_id` (`project_id`),
  KEY `idx_messages_sender_id` (`sender_id`),
  CONSTRAINT `fk_messages_project_id` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_messages_sender_id` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `filename` varchar(255) DEFAULT NULL,
  `filepath` varchar(255) DEFAULT NULL,
  `project_id` int DEFAULT NULL,
  `uploaded_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `uploaded_by` (`uploaded_by`),
  CONSTRAINT `files_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `files_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `message` text NOT NULL,
  `user_id` int NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_id` (`user_id`),
  KEY `idx_notifications_user_read` (`user_id`,`is_read`),
  CONSTRAINT `fk_notifications_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `activities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action` varchar(255) DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `invitations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) DEFAULT NULL,
  `project_id` int DEFAULT NULL,
  `token` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ==========================================
-- Permission/Settings Safety Migration Block
-- Ensures DB supports creator/uploader rules
-- ==========================================

-- projects.created_by must exist and be required
SET @has_projects_created_by := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'projects'
    AND COLUMN_NAME = 'created_by'
);
SET @sql_projects_created_by := IF(
  @has_projects_created_by = 0,
  'ALTER TABLE projects ADD COLUMN created_by INT NOT NULL',
  'SELECT 1'
);
PREPARE stmt_projects_created_by FROM @sql_projects_created_by;
EXECUTE stmt_projects_created_by;
DEALLOCATE PREPARE stmt_projects_created_by;

-- projects.status must exist
SET @has_projects_status := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'projects'
    AND COLUMN_NAME = 'status'
);
SET @sql_projects_status := IF(
  @has_projects_status = 0,
  'ALTER TABLE projects ADD COLUMN status ENUM(''active'',''completed'') DEFAULT ''active''',
  'SELECT 1'
);
PREPARE stmt_projects_status FROM @sql_projects_status;
EXECUTE stmt_projects_status;
DEALLOCATE PREPARE stmt_projects_status;

-- files.uploaded_by must exist (used for file delete permission)
SET @has_files_uploaded_by := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'files'
    AND COLUMN_NAME = 'uploaded_by'
);
SET @sql_files_uploaded_by := IF(
  @has_files_uploaded_by = 0,
  'ALTER TABLE files ADD COLUMN uploaded_by INT NULL',
  'SELECT 1'
);
PREPARE stmt_files_uploaded_by FROM @sql_files_uploaded_by;
EXECUTE stmt_files_uploaded_by;
DEALLOCATE PREPARE stmt_files_uploaded_by;

-- project_members.can_manage_tasks must exist
SET @has_pm_can_manage_tasks := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'project_members'
    AND COLUMN_NAME = 'can_manage_tasks'
);
SET @sql_pm_can_manage_tasks := IF(
  @has_pm_can_manage_tasks = 0,
  'ALTER TABLE project_members ADD COLUMN can_manage_tasks BOOLEAN DEFAULT TRUE',
  'SELECT 1'
);
PREPARE stmt_pm_can_manage_tasks FROM @sql_pm_can_manage_tasks;
EXECUTE stmt_pm_can_manage_tasks;
DEALLOCATE PREPARE stmt_pm_can_manage_tasks;

-- project_members.can_manage_files must exist
SET @has_pm_can_manage_files := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'project_members'
    AND COLUMN_NAME = 'can_manage_files'
);
SET @sql_pm_can_manage_files := IF(
  @has_pm_can_manage_files = 0,
  'ALTER TABLE project_members ADD COLUMN can_manage_files BOOLEAN DEFAULT TRUE',
  'SELECT 1'
);
PREPARE stmt_pm_can_manage_files FROM @sql_pm_can_manage_files;
EXECUTE stmt_pm_can_manage_files;
DEALLOCATE PREPARE stmt_pm_can_manage_files;

-- project_members.can_chat must exist
SET @has_pm_can_chat := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'project_members'
    AND COLUMN_NAME = 'can_chat'
);
SET @sql_pm_can_chat := IF(
  @has_pm_can_chat = 0,
  'ALTER TABLE project_members ADD COLUMN can_chat BOOLEAN DEFAULT TRUE',
  'SELECT 1'
);
PREPARE stmt_pm_can_chat FROM @sql_pm_can_chat;
EXECUTE stmt_pm_can_chat;
DEALLOCATE PREPARE stmt_pm_can_chat;

-- project_members.can_change_project_name must exist
SET @has_pm_can_change_project_name := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'project_members'
    AND COLUMN_NAME = 'can_change_project_name'
);
SET @sql_pm_can_change_project_name := IF(
  @has_pm_can_change_project_name = 0,
  'ALTER TABLE project_members ADD COLUMN can_change_project_name BOOLEAN DEFAULT FALSE',
  'SELECT 1'
);
PREPARE stmt_pm_can_change_project_name FROM @sql_pm_can_change_project_name;
EXECUTE stmt_pm_can_change_project_name;
DEALLOCATE PREPARE stmt_pm_can_change_project_name;

-- project_members.can_add_members must exist
SET @has_pm_can_add_members := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'project_members'
    AND COLUMN_NAME = 'can_add_members'
);
SET @sql_pm_can_add_members := IF(
  @has_pm_can_add_members = 0,
  'ALTER TABLE project_members ADD COLUMN can_add_members BOOLEAN DEFAULT FALSE',
  'SELECT 1'
);
PREPARE stmt_pm_can_add_members FROM @sql_pm_can_add_members;
EXECUTE stmt_pm_can_add_members;
DEALLOCATE PREPARE stmt_pm_can_add_members;

-- project_members.member_role must exist
SET @has_pm_member_role := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'project_members'
    AND COLUMN_NAME = 'member_role'
);
SET @sql_pm_member_role := IF(
  @has_pm_member_role = 0,
  'ALTER TABLE project_members ADD COLUMN member_role VARCHAR(30) DEFAULT ''member''',
  'SELECT 1'
);
PREPARE stmt_pm_member_role FROM @sql_pm_member_role;
EXECUTE stmt_pm_member_role;
DEALLOCATE PREPARE stmt_pm_member_role;

-- users.reset_token must exist
SET @has_users_reset_token := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'reset_token'
);
SET @sql_users_reset_token := IF(
  @has_users_reset_token = 0,
  'ALTER TABLE users ADD COLUMN reset_token VARCHAR(255)',
  'SELECT 1'
);
PREPARE stmt_users_reset_token FROM @sql_users_reset_token;
EXECUTE stmt_users_reset_token;
DEALLOCATE PREPARE stmt_users_reset_token;

-- users.reset_token_expiry must exist
SET @has_users_reset_token_expiry := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'reset_token_expiry'
);
SET @sql_users_reset_token_expiry := IF(
  @has_users_reset_token_expiry = 0,
  'ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME',
  'SELECT 1'
);
PREPARE stmt_users_reset_token_expiry FROM @sql_users_reset_token_expiry;
EXECUTE stmt_users_reset_token_expiry;
DEALLOCATE PREPARE stmt_users_reset_token_expiry;

-- Ensure foreign key projects.created_by -> users.id exists
SET @has_fk_projects_creator := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'projects'
    AND CONSTRAINT_NAME = 'fk_projects_created_by'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_fk_projects_creator := IF(
  @has_fk_projects_creator = 0,
  'ALTER TABLE projects ADD CONSTRAINT fk_projects_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt_fk_projects_creator FROM @sql_fk_projects_creator;
EXECUTE stmt_fk_projects_creator;
DEALLOCATE PREPARE stmt_fk_projects_creator;

-- Ensure foreign key files.uploaded_by -> users.id exists
SET @has_fk_files_uploader := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'files'
    AND CONSTRAINT_NAME = 'files_ibfk_2'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_fk_files_uploader := IF(
  @has_fk_files_uploader = 0,
  'ALTER TABLE files ADD CONSTRAINT files_ibfk_2 FOREIGN KEY (uploaded_by) REFERENCES users(id)',
  'SELECT 1'
);
PREPARE stmt_fk_files_uploader FROM @sql_fk_files_uploader;
EXECUTE stmt_fk_files_uploader;
DEALLOCATE PREPARE stmt_fk_files_uploader;

-- projects.github_repo must exist
SET @has_projects_github_repo := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'projects'
    AND COLUMN_NAME = 'github_repo'
);
SET @sql_projects_github_repo := IF(
  @has_projects_github_repo = 0,
  'ALTER TABLE projects ADD COLUMN github_repo VARCHAR(255)',
  'SELECT 1'
);
PREPARE stmt_projects_github_repo FROM @sql_projects_github_repo;
EXECUTE stmt_projects_github_repo;
DEALLOCATE PREPARE stmt_projects_github_repo;

-- ============================================================
-- NEW FEATURE TABLES (added in v2)
-- ============================================================

-- New columns on tasks: priority, due_date, estimated_hours, milestone_id
SET @has_tasks_priority := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks' AND COLUMN_NAME = 'priority');
SET @sql_tasks_priority := IF(@has_tasks_priority = 0, "ALTER TABLE tasks ADD COLUMN priority ENUM('low','medium','high') DEFAULT 'medium'", 'SELECT 1');
PREPARE stmt FROM @sql_tasks_priority; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_tasks_due_date := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks' AND COLUMN_NAME = 'due_date');
SET @sql_tasks_due_date := IF(@has_tasks_due_date = 0, 'ALTER TABLE tasks ADD COLUMN due_date DATE DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql_tasks_due_date; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_tasks_estimated_hours := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks' AND COLUMN_NAME = 'estimated_hours');
SET @sql_tasks_estimated_hours := IF(@has_tasks_estimated_hours = 0, 'ALTER TABLE tasks ADD COLUMN estimated_hours DECIMAL(6,2) DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql_tasks_estimated_hours; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_tasks_milestone_id := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks' AND COLUMN_NAME = 'milestone_id');
SET @sql_tasks_milestone_id := IF(@has_tasks_milestone_id = 0, 'ALTER TABLE tasks ADD COLUMN milestone_id INT DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql_tasks_milestone_id; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Task comments
CREATE TABLE IF NOT EXISTS `task_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL,
  `user_id` int NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_task_comments_task` (`task_id`),
  KEY `idx_task_comments_user` (`user_id`),
  CONSTRAINT `fk_tc_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tc_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Milestones
CREATE TABLE IF NOT EXISTS `milestones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `due_date` date DEFAULT NULL,
  `status` enum('open','completed') DEFAULT 'open',
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_milestones_project` (`project_id`),
  CONSTRAINT `fk_milestones_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_milestones_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Message reactions
CREATE TABLE IF NOT EXISTS `message_reactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `message_id` int NOT NULL,
  `user_id` int NOT NULL,
  `emoji` varchar(20) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_reaction` (`message_id`, `user_id`, `emoji`),
  KEY `idx_mr_message` (`message_id`),
  CONSTRAINT `fk_mr_message` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Time logs
CREATE TABLE IF NOT EXISTS `time_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL,
  `user_id` int NOT NULL,
  `hours` decimal(6,2) NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `logged_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tl_task` (`task_id`),
  KEY `idx_tl_user` (`user_id`),
  CONSTRAINT `fk_tl_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tl_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
