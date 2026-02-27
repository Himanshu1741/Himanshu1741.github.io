require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { Sequelize } = require("sequelize");

const s = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  { host: process.env.DB_HOST, dialect: "mysql", logging: false },
);

s.query(
  "SELECT id, title, github_repo FROM projects WHERE github_repo IS NOT NULL AND github_repo != ''",
)
  .then(([rows]) => {
    if (!rows.length) {
      console.log("No projects have a github_repo set.");
    } else {
      console.table(rows);
    }
    s.close();
  })
  .catch((e) => {
    console.error("DB error:", e.message);
    s.close();
  });
