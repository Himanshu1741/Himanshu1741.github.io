require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { Sequelize } = require("sequelize");

const s = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  { host: process.env.DB_HOST, dialect: "mysql", logging: false },
);

// Verify each stored github_repo against the API and clear ones that 404
async function run() {
  const [rows] = await s.query(
    "SELECT id, title, github_repo FROM projects WHERE github_repo IS NOT NULL AND github_repo != ''",
  );

  const token = process.env.GITHUB_TOKEN;
  const headers = {
    "User-Agent": "student-collab-hub",
    Accept: "application/vnd.github+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  for (const row of rows) {
    const raw = row.github_repo.trim();
    // Extract owner/repo
    const m =
      raw.match(/github\.com\/([^/]+)\/([^/\s]+?)(?:\.git)?\/?$/i) ||
      raw.match(/^([^/]+)\/([^/]+)$/);
    if (!m) {
      console.log(
        `[SKIP] Project ${row.id} "${row.title}": unrecognised format "${raw}"`,
      );
      continue;
    }
    const owner = m[1],
      repo = m[2].replace(/\.git$/i, "");
    let status;
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers,
      });
      status = res.status;
    } catch (e) {
      console.log(
        `[ERROR] Project ${row.id} "${row.title}": network error - ${e.message}`,
      );
      continue;
    }

    if (status === 200) {
      console.log(
        `[OK]   Project ${row.id} "${row.title}": ${owner}/${repo} is accessible`,
      );
    } else if (status === 404) {
      await s.query("UPDATE projects SET github_repo = NULL WHERE id = ?", {
        replacements: [row.id],
      });
      console.log(
        `[FIXED] Project ${row.id} "${row.title}": cleared invalid repo "${owner}/${repo}" (404)`,
      );
    } else {
      console.log(
        `[WARN]  Project ${row.id} "${row.title}": ${owner}/${repo} returned ${status}`,
      );
    }
  }

  await s.close();
}

run().catch((e) => {
  console.error(e.message);
  s.close();
});
