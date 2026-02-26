const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const TaskComment = sequelize.define("TaskComment", {
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
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  }
}, {
  tableName: "task_comments",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false
});

module.exports = TaskComment;
