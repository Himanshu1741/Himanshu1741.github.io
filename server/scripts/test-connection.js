require("dotenv").config();
const { Sequelize } = require("sequelize");

console.log("------------------------------------------------");
console.log("Attempting to connect to database...");
console.log(`Host: ${process.env.DB_HOST || "localhost"}`);
console.log(`User: ${process.env.DB_USER}`);
console.log(`Database: ${process.env.DB_NAME}`);
console.log("------------------------------------------------");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false,
  }
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connection has been established successfully.");
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error.message);
  } finally {
    await sequelize.close();
  }
})();