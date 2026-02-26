const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Task = sequelize.define("Task", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.ENUM("todo", "in_progress", "completed"),
    defaultValue: "todo",
  },
  priority: {
    type: DataTypes.ENUM("low", "medium", "high"),
    defaultValue: "medium",
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  assigned_to: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  estimated_hours: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true,
  }
}, {
  tableName: "tasks",
  timestamps: false
});

module.exports = Task;
