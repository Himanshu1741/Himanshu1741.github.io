const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const File = sequelize.define("File", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  filepath: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  uploaded_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  tableName: "files",
  timestamps: false,
});

module.exports = File;
