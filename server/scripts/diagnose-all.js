/* Full system diagnostic: DB + GitHub + Server + Repo validation */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { Sequelize } = require("sequelize");
const net = require("net");

const s = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  { host: process.env.DB_HOST, dialect: "mysql", logging: false },
);

const ghHeaders = {
  Accept: "application/vnd.github+json",
  "User-Agent": "student-collab-hub",
};

function isPortOpen(port) {
  return new Promise((resolve) => {
    const c = net.createConnection(port, "127.0.0.1");
    c.on("connect", () => {
      c.destroy();
      resolve(true);
    });
    c.on("error", () => resolve(false));
  });
}

async function run() {
  console.log("========================================");
  console.log(" SYSTEM DIAGNOSTIC");
  console.log("========================================\n");

  // 1. DATABASE
  console.log("--- 1. DATABASE ---");
  try {
    await s.authenticate();
    console.log(
      "[OK ] DB connected:",
      process.env.DB_NAME,
      "@",
      process.env.DB_HOST,
    );
  } catch (e) {
    console.error("[ERR] DB connection FAILED:", e.message);
    process.exit(1);
  }

  // 2. GITHUB API (public / unauthenticated)
  console.log("\n--- 2. GITHUB API ---");
  const rateRes = await fetch("https://api.github.com/rate_limit", {
    headers: ghHeaders,
  });
  const rateData = await rateRes.json();
  const core = rateData?.rate || rateData?.resources?.core;
  if (rateRes.status === 200 && core) {
    console.log("[OK ] GitHub API reachable (unauthenticated)");
    console.log(`      Rate limit: ${core.remaining}/${core.limit} remaining`);
  } else {
    console.error("[ERR] GitHub API unreachable. Status:", rateRes.status);
  }

  // 3. SERVER / CLIENT PORTS
  console.log("\n--- 3. PORTS ---");
  const [server5000, client3000] = await Promise.all([
    isPortOpen(5000),
    isPortOpen(3000),
  ]);
  console.log(
    "[" + (server5000 ? "OK " : "ERR") + "] Server :5000 =",
    server5000 ? "RUNNING" : "NOT running",
  );
  console.log(
    "[" + (client3000 ? "OK " : "ERR") + "] Client :3000 =",
    client3000 ? "RUNNING" : "NOT running",
  );

  // 4. ALL PROJECTS WITH GITHUB_REPO
  console.log("\n--- 4. PROJECTS WITH GITHUB REPO ---");
  const [rows] = await s.query(
    "SELECT id, title, github_repo FROM projects WHERE github_repo IS NOT NULL AND github_repo != ''",
  );
  console.log("Count:", rows.length);
  if (rows.length === 0) {
    console.log("No projects have a github_repo set.");
  }

  // 5. TEST EACH REPO AGAINST GITHUB API
  console.log("\n--- 5. GITHUB REPO VALIDATION ---");
  const toFix = [];
  for (const row of rows) {
    const raw = (row.github_repo || "").trim();
    const m =
      raw.match(/github\.com\/([^/]+)\/([^/\s]+?)(?:\.git)?\/?$/i) ||
      raw.match(/^([^/]+)\/([^/]+)$/);

    if (!m) {
      console.log(
        "[BAD] Project",
        row.id,
        `"${row.title}" — invalid format: ${raw}`,
      );
      toFix.push(row.id);
      continue;
    }

    const owner = m[1];
    const repo = m[2].replace(/\.git$/i, "");
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: ghHeaders,
    });

    if (res.status === 200) {
      const data = await res.json();
      console.log(
        `[OK ] Project ${row.id} "${row.title}" => ${owner}/${repo} (${data.private ? "private" : "public"})`,
      );
    } else if (res.status === 404) {
      // No token — 404 means not found or private (private repos are inaccessible without auth)
      console.log(
        `[404] Project ${row.id} "${row.title}" => ${owner}/${repo} — NOT FOUND or PRIVATE`,
      );
      toFix.push(row.id);
    } else {
      console.log(
        `[${res.status}] Project ${row.id} "${row.title}" => ${owner}/${repo}`,
      );
    }
  }

  // 6. FIX: CLEAR BAD REPOS
  console.log("\n--- 6. FIX ---");
  if (toFix.length === 0) {
    console.log("[OK ] No bad repos found. Nothing to fix.");
  } else {
    for (const id of toFix) {
      const [, meta] = await s.query(
        "UPDATE projects SET github_repo = NULL WHERE id = ?",
        { replacements: [id] },
      );
      console.log(
        `[FIX] Cleared github_repo for project id=${id} | rows affected: ${meta.affectedRows}`,
      );
    }
  }

  // 7. FINAL STATE
  console.log("\n--- 7. FINAL DB STATE ---");
  const [final] = await s.query(
    "SELECT id, title, github_repo FROM projects WHERE id IN (" +
      [...new Set([...rows.map((r) => r.id), 13, 22])].join(",") +
      ")",
  );
  console.table(final);

  await s.close();
  console.log("\n========================================");
  console.log(" DONE");
  console.log("========================================");
}

run().catch((e) => {
  console.error("Fatal:", e.message);
  s.close();
  process.exit(1);
});
