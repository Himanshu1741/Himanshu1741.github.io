const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const AdminLog = sequelize.define(
  "AdminLog",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    admin_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    target_type: {
      type: DataTypes.ENUM("user", "project", "system"),
      allowNull: false,
    },
    target_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    target_label: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "admin_logs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);

module.exports = AdminLog;
