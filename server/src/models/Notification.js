const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
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
      type: DataTypes.ENUM("low", "medium", "high", "critical"),
      defaultValue: "medium",
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_read_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    mentioned_users: {
      type: DataTypes.JSON, // Array of user IDs who were mentioned
      defaultValue: [],
    },
    related_resource: {
      type: DataTypes.JSON, // { type: 'task', id: 123 } or { type: 'message', id: 456 }
      allowNull: true,
    },
    action_url: {
      type: DataTypes.STRING,
      allowNull: true, // e.g., "/project/1/task/42"
    },
    escalated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    escalated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    in_digest: {
      type: DataTypes.BOOLEAN,
      defaultValue: false, // part of digest instead of instant notification
    },
  },
  {
    tableName: "notifications",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

module.exports = Notification;
