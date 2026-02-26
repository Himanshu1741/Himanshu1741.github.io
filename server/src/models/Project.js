const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Project = sequelize.define("Project", {
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
  github_repo: {
    type: DataTypes.STRING,
  },
  status: {
    type: DataTypes.ENUM("active", "completed"),
    allowNull: false,
    defaultValue: "active",
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }
}, {
  tableName: "projects",
  timestamps: false
});

module.exports = Project;
