const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Invitation = sequelize.define("Invitation", {
  email: {
    type: DataTypes.STRING,
  },
  project_id: {
    type: DataTypes.INTEGER,
  },
  token: {
    type: DataTypes.STRING,
  }
}, {
  tableName: "invitations",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false
});

module.exports = Invitation;
