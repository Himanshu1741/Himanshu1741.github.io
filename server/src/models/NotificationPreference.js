const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const NotificationPreference = sequelize.define(
  "NotificationPreference",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // null = global preferences
    },
    notification_type: {
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
      allowNull: false,
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    frequency: {
      type: DataTypes.ENUM("instant", "daily_digest", "weekly_digest", "never"),
      defaultValue: "instant",
    },
    channels: {
      type: DataTypes.JSON, // ['email', 'in_app', 'push']
      defaultValue: ["in_app"],
    },
    escalate_if_unread: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    escalation_delay_hours: {
      type: DataTypes.INTEGER,
      defaultValue: 24,
    },
  },
  {
    tableName: "notification_preferences",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

module.exports = NotificationPreference;
