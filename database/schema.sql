CREATE DATABASE IF NOT EXISTS student_collab_hub;

USE student_collab_hub;

-- ============================================================
-- CORE USERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expiry` datetime DEFAULT NULL,
  `role` enum('admin','member') DEFAULT 'member',
  `is_suspended` tinyint(1) DEFAULT '0',
  `bio` text DEFAULT NULL,
  `skills` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_suspended` (`is_suspended`)
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
  KEY `idx_messages_created` (`created_at`),
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
  `type` enum('mention','message','task_assigned','task_completed','milestone','file_shared','project_update','deadline_reminder') DEFAULT 'project_update',
  `severity` enum('low','medium','high','critical') DEFAULT 'medium',
  `is_read` tinyint(1) DEFAULT '0',
  `is_read_at` datetime DEFAULT NULL,
  `mentioned_users` json DEFAULT NULL,
  `related_resource` json DEFAULT NULL,
  `action_url` varchar(255) DEFAULT NULL,
  `escalated` tinyint(1) DEFAULT '0',
  `escalated_at` datetime DEFAULT NULL,
  `in_digest` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_id` (`user_id`),
  KEY `idx_notifications_user_read` (`user_id`,`is_read`),
  KEY `idx_notifications_type` (`type`),
  KEY `idx_notifications_severity` (`severity`),
  KEY `idx_notifications_created` (`created_at`),
  CONSTRAINT `fk_notifications_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS `notification_preferences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `project_id` int DEFAULT NULL,
  `notification_type` enum('mention','message','task_assigned','task_completed','milestone','file_shared','project_update','deadline_reminder') NOT NULL,
  `enabled` tinyint(1) DEFAULT '1',
  `frequency` enum('instant','daily_digest','weekly_digest','never') DEFAULT 'instant',
  `channels` json DEFAULT '["in_app"]',
  `escalate_if_unread` tinyint(1) DEFAULT '0',
  `escalation_delay_hours` int DEFAULT '24',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_np_user` (`user_id`),
  KEY `idx_np_project` (`project_id`),
  KEY `idx_np_type` (`notification_type`),
  CONSTRAINT `fk_np_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_np_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================
-- DO NOT DISTURB SCHEDULE TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS `do_not_disturb_schedules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `enabled` tinyint(1) DEFAULT '0',
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `days_of_week` json DEFAULT '[1,2,3,4,5]',
  `silence_all` tinyint(1) DEFAULT '0',
  `allow_critical_only` tinyint(1) DEFAULT '1',
  `timezone` varchar(100) DEFAULT 'UTC',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dnd_user` (`user_id`),
  CONSTRAINT `fk_dnd_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
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

-- ============================================================
-- MIGRATION: Add missing columns to existing tables
-- ============================================================

-- Add bio and skills to users if not exists
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `bio` text DEFAULT NULL;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `skills` varchar(500) DEFAULT NULL;

-- Add type, severity, and other notification fields if not exists
ALTER TABLE `notifications` ADD COLUMN IF NOT EXISTS `type` enum('mention','message','task_assigned','task_completed','milestone','file_shared','project_update','deadline_reminder') DEFAULT 'project_update';
ALTER TABLE `notifications` ADD COLUMN IF NOT EXISTS `severity` enum('low','medium','high','critical') DEFAULT 'medium';
ALTER TABLE `notifications` ADD COLUMN IF NOT EXISTS `is_read_at` datetime DEFAULT NULL;
ALTER TABLE `notifications` ADD COLUMN IF NOT EXISTS `mentioned_users` json DEFAULT NULL;
ALTER TABLE `notifications` ADD COLUMN IF NOT EXISTS `related_resource` json DEFAULT NULL;
ALTER TABLE `notifications` ADD COLUMN IF NOT EXISTS `action_url` varchar(255) DEFAULT NULL;
ALTER TABLE `notifications` ADD COLUMN IF NOT EXISTS `escalated` tinyint(1) DEFAULT '0';
ALTER TABLE `notifications` ADD COLUMN IF NOT EXISTS `escalated_at` datetime DEFAULT NULL;
ALTER TABLE `notifications` ADD COLUMN IF NOT EXISTS `in_digest` tinyint(1) DEFAULT '0';
ALTER TABLE `notifications` ADD COLUMN IF NOT EXISTS `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Add indexes for performance
ALTER TABLE `notifications` ADD INDEX IF NOT EXISTS `idx_notifications_type` (`type`);
ALTER TABLE `notifications` ADD INDEX IF NOT EXISTS `idx_notifications_severity` (`severity`);
ALTER TABLE `notifications` ADD INDEX IF NOT EXISTS `idx_notifications_created` (`created_at`);

-- ============================================================
-- PERMISSION/SETTINGS SAFETY MIGRATION BLOCK
-- ============================================================

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

-- files.uploaded_by must exist
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

-- project_members permission columns
ALTER TABLE `project_members` ADD COLUMN IF NOT EXISTS `can_manage_tasks` BOOLEAN DEFAULT TRUE;
ALTER TABLE `project_members` ADD COLUMN IF NOT EXISTS `can_manage_files` BOOLEAN DEFAULT TRUE;
ALTER TABLE `project_members` ADD COLUMN IF NOT EXISTS `can_chat` BOOLEAN DEFAULT TRUE;
ALTER TABLE `project_members` ADD COLUMN IF NOT EXISTS `can_change_project_name` BOOLEAN DEFAULT FALSE;
ALTER TABLE `project_members` ADD COLUMN IF NOT EXISTS `can_add_members` BOOLEAN DEFAULT FALSE;
ALTER TABLE `project_members` ADD COLUMN IF NOT EXISTS `member_role` VARCHAR(30) DEFAULT 'member';

-- users columns
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `reset_token` VARCHAR(255);
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `reset_token_expiry` DATETIME;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `is_suspended` BOOLEAN DEFAULT FALSE;

-- Ensure foreign key projects.created_by -> users.id
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

-- Ensure foreign key files.uploaded_by -> users.id
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
ALTER TABLE `projects` ADD COLUMN IF NOT EXISTS `github_repo` VARCHAR(255);

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

-- is_suspended column (run if upgrading existing DB)
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `is_suspended` tinyint(1) DEFAULT '0';

-- Admin audit log
CREATE TABLE IF NOT EXISTS `admin_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int NOT NULL,
  `admin_name` varchar(100) NOT NULL,
  `action` varchar(100) NOT NULL,
  `target_type` enum('user','project','system') NOT NULL,
  `target_id` int DEFAULT NULL,
  `target_label` varchar(200) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_al_admin` (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
