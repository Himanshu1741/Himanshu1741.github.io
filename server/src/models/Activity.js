const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Activity = sequelize.define("Activity", {
  action: DataTypes.STRING,
  user_id: DataTypes.INTEGER
}, {
  tableName: "activities",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false
});

module.exports = Activity;
