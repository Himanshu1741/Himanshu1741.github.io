const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ProjectMember = sequelize.define("ProjectMember", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  can_manage_tasks: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  can_manage_files: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  can_chat: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  can_change_project_name: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  can_add_members: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  member_role: {
    type: DataTypes.STRING(30),
    defaultValue: "member",
  }
}, {
  tableName: "project_members",
  timestamps: false
});

module.exports = ProjectMember;
