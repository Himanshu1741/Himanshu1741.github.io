require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { Sequelize } = require("sequelize");

const s = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  { host: process.env.DB_HOST, dialect: "mysql", logging: false },
);

const headers = {
  Authorization: "Bearer " + process.env.GITHUB_TOKEN,
  Accept: "application/vnd.github+json",
  "User-Agent": "student-collab-hub",
};

async function run() {
  // 1. Verify token
  const meRes = await fetch("https://api.github.com/user", { headers });
  const me = await meRes.json();
  console.log("=== GitHub Token Check ===");
  console.log("Status     :", meRes.status);
  console.log("Authed as  :", me.login || me.message);
  console.log("Rate left  :", meRes.headers.get("x-ratelimit-remaining"));
  console.log("");

  // 2. Check all stored repos
  const [rows] = await s.query(
    "SELECT id, title, github_repo FROM projects WHERE github_repo IS NOT NULL AND github_repo != ''",
  );
  console.log("=== Projects with GitHub repo ===");
  console.log("Count:", rows.length);
  console.log("");

  for (const row of rows) {
    const raw = (row.github_repo || "").trim();
    const m =
      raw.match(/github\.com\/([^/]+)\/([^/\s]+?)(?:\.git)?\/?$/i) ||
      raw.match(/^([^/]+)\/([^/]+)$/);

    if (!m) {
      console.log("[BAD FORMAT] Project", row.id, `"${row.title}"`, "->", raw);
      continue;
    }

    const owner = m[1];
    const repo = m[2].replace(/\.git$/i, "");
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
    const r = await fetch(apiUrl, { headers });

    if (r.status === 200) {
      const data = await r.json();
      console.log(
        `[OK  200] Project ${row.id} "${row.title}" => ${owner}/${repo} (${data.private ? "private" : "public"})`,
      );
    } else if (r.status === 404) {
      console.log(
        `[FAIL 404] Project ${row.id} "${row.title}" => ${owner}/${repo} — NOT FOUND, clearing...`,
      );
      const [, meta] = await s.query(
        "UPDATE projects SET github_repo = NULL WHERE id = ?",
        { replacements: [row.id] },
      );
      console.log("  -> Rows updated:", meta.affectedRows);
    } else {
      console.log(
        `[WARN ${r.status}] Project ${row.id} "${row.title}" => ${owner}/${repo}`,
      );
    }
  }

  // 3. Verify final state
  const [final] = await s.query(
    "SELECT id, title, github_repo FROM projects WHERE github_repo IS NOT NULL AND github_repo != ''",
  );
  console.log("\n=== Final DB state (repos still linked) ===");
  if (final.length === 0) {
    console.log("No projects with github_repo.");
  } else {
    console.table(final);
  }

  await s.close();
}

run().catch((e) => {
  console.error("Fatal:", e.message);
  s.close();
});
