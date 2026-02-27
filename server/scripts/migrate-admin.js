/**
 * Migration: add is_suspended to users + create admin_logs table
 * Run: node scripts/migrate-admin.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const sequelize = require("../src/config/db");

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✓ Connected to database");

    const [cols] = await sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_suspended'`,
    );
    if (cols.length === 0) {
      await sequelize.query(
        `ALTER TABLE users ADD COLUMN is_suspended tinyint(1) NOT NULL DEFAULT 0`,
      );
      console.log("✓ users.is_suspended column added");
    } else {
      console.log("✓ users.is_suspended already exists, skipped");
    }

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id          int          NOT NULL AUTO_INCREMENT,
        admin_id    int          NOT NULL,
        admin_name  varchar(100) NOT NULL,
        action      varchar(100) NOT NULL,
        target_type enum('user','project','system') NOT NULL,
        target_id   int          DEFAULT NULL,
        target_label varchar(200) DEFAULT NULL,
        details     text         DEFAULT NULL,
        created_at  timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_al_admin (admin_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    console.log("✓ admin_logs table ready");

    console.log("\n✅ Migration complete. You can now restart the server.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  }
})();
