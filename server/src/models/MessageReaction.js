const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const MessageReaction = sequelize.define("MessageReaction", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  message_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  emoji: {
    type: DataTypes.STRING(16),
    allowNull: false,
  }
}, {
  tableName: "message_reactions",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false
});

module.exports = MessageReaction;
