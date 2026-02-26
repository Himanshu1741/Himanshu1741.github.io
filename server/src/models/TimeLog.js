const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const TimeLog = sequelize.define("TimeLog", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  task_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  hours: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false,
  },
  note: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  logged_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: "time_logs",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false
});

module.exports = TimeLog;
