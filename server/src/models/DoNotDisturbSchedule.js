const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const DoNotDisturbSchedule = sequelize.define(
  "DoNotDisturbSchedule",
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
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false, // e.g., "18:00"
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false, // e.g., "09:00"
    },
    days_of_week: {
      type: DataTypes.JSON, // [0-6] where 0=Sunday
      defaultValue: [1, 2, 3, 4, 5], // Mon-Fri by default
    },
    silence_all: {
      type: DataTypes.BOOLEAN,
      defaultValue: false, // if true, no notifications at all
    },
    allow_critical_only: {
      type: DataTypes.BOOLEAN,
      defaultValue: true, // if true, only show critical/mention notifications
    },
    timezone: {
      type: DataTypes.STRING,
      defaultValue: "UTC",
    },
  },
  {
    tableName: "do_not_disturb_schedules",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

module.exports = DoNotDisturbSchedule;
