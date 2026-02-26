const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Message = sequelize.define("Message", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }
}, {
  tableName: "messages",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false
});

module.exports = Message;
