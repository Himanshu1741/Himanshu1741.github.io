"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create notifications table
    await queryInterface.createTable("notifications", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      type: {
        type: Sequelize.ENUM(
          "mention",
          "message",
          "task_assigned",
          "task_completed",
          "milestone",
          "file_shared",
          "project_update",
          "deadline_reminder",
        ),
        defaultValue: "project_update",
      },
      severity: {
        type: Sequelize.ENUM("low", "medium", "high", "critical"),
        defaultValue: "medium",
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_read_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      mentioned_users: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
      related_resource: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      action_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      escalated: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      escalated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      in_digest: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Create notification_preferences table
    await queryInterface.createTable("notification_preferences", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "projects",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      notification_type: {
        type: Sequelize.ENUM(
          "mention",
          "message",
          "task_assigned",
          "task_completed",
          "milestone",
          "file_shared",
          "project_update",
          "deadline_reminder",
        ),
        allowNull: false,
      },
      enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      frequency: {
        type: Sequelize.ENUM(
          "instant",
          "daily_digest",
          "weekly_digest",
          "never",
        ),
        defaultValue: "instant",
      },
      channels: {
        type: Sequelize.JSON,
        defaultValue: ["in_app"],
      },
      escalate_if_unread: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      escalation_delay_hours: {
        type: Sequelize.INTEGER,
        defaultValue: 24,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Create do_not_disturb_schedules table
    await queryInterface.createTable("do_not_disturb_schedules", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      end_time: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      days_of_week: {
        type: Sequelize.JSON,
        defaultValue: [1, 2, 3, 4, 5],
      },
      silence_all: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      allow_critical_only: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      timezone: {
        type: Sequelize.STRING,
        defaultValue: "UTC",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Add indexes
    await queryInterface.addIndex("notifications", ["user_id"]);
    await queryInterface.addIndex("notifications", ["created_at"]);
    await queryInterface.addIndex("notification_preferences", ["user_id"]);
    await queryInterface.addIndex("notification_preferences", ["project_id"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("do_not_disturb_schedules");
    await queryInterface.dropTable("notification_preferences");
    await queryInterface.dropTable("notifications");
  },
};
