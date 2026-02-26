const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Milestone = sequelize.define("Milestone", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM("open", "completed"),
    defaultValue: "open",
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }
}, {
  tableName: "milestones",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false
});

module.exports = Milestone;
