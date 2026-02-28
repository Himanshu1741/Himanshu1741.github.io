/**
 * githubService.js
 * GitHub REST API integration — commits, issues, branches, pull requests, repo info.
 * Reads GITHUB_TOKEN from env for authenticated requests (higher rate limits).
 */

const BASE_URL = "https://api.github.com";

/**
 * Build standard headers for GitHub API requests.
 */
function buildHeaders() {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "real-time-collab-hub",
  };
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

/**
 * Parse a GitHub repo URL or "owner/repo" slug into { owner, repo }.
 * Returns null if the string cannot be parsed.
 *
 * Supports:
 *   https://github.com/owner/repo
 *   https://github.com/owner/repo.git
 *   http://github.com/owner/repo
 *   git@github.com:owner/repo.git
 *   owner/repo
 */
function parseRepoSlug(repoUrl) {
  if (!repoUrl || typeof repoUrl !== "string") return null;
  const raw = repoUrl.trim();

  // SSH URL: git@github.com:owner/repo.git
  const sshMatch = raw.match(
    /^git@github\.com:([^/]+)\/([^/\s]+?)(?:\.git)?\/?$/i,
  );
  if (sshMatch) return { owner: sshMatch[1], repo: sshMatch[2] };

  // HTTPS URL: https://github.com/owner/repo[.git]
  const httpsMatch = raw.match(
    /github\.com\/([^/]+)\/([^/\s]+?)(?:\.git)?\/?(?:\?.*)?$/i,
  );
  if (httpsMatch) return { owner: httpsMatch[1], repo: httpsMatch[2] };

  // Plain slug: owner/repo
  const slugMatch = raw.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  if (slugMatch) return { owner: slugMatch[1], repo: slugMatch[2] };

  return null;
}

/**
 * Perform a GET request against the GitHub API.
 * Throws an error with status code on non-2xx responses.
 */
async function githubFetch(path, query = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  });

  const res = await fetch(url.toString(), { headers: buildHeaders() });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.message || `GitHub API error ${res.status}`);
    err.statusCode = res.status;
    throw err;
  }

  return res.json();
}

/**
 * Get repository metadata (stars, forks, language, description, …).
 */
async function getRepoInfo(owner, repo) {
  return githubFetch(`/repos/${owner}/${repo}`);
}

/**
 * Get the most recent commits on the default branch (up to `perPage`, max 100).
 */
async function getCommits(
  owner,
  repo,
  { perPage = 20, page = 1, branch } = {},
) {
  const query = { per_page: perPage, page };
  if (branch) query.sha = branch;
  return githubFetch(`/repos/${owner}/${repo}/commits`, query);
}

/**
 * Get open issues (excludes pull requests).
 */
async function getIssues(
  owner,
  repo,
  { perPage = 20, page = 1, state = "open" } = {},
) {
  const issues = await githubFetch(`/repos/${owner}/${repo}/issues`, {
    state,
    per_page: perPage,
    page,
  });
  // GitHub issues endpoint returns PRs too — filter them out
  return issues.filter((i) => !i.pull_request);
}

/**
 * Get branches for the repository.
 */
async function getBranches(owner, repo, { perPage = 30, page = 1 } = {}) {
  return githubFetch(`/repos/${owner}/${repo}/branches`, {
    per_page: perPage,
    page,
  });
}

/**
 * Get open pull requests.
 */
async function getPullRequests(
  owner,
  repo,
  { perPage = 20, page = 1, state = "open" } = {},
) {
  return githubFetch(`/repos/${owner}/${repo}/pulls`, {
    state,
    per_page: perPage,
    page,
  });
}

/**
 * Get repository contributors.
 */
async function getContributors(owner, repo, { perPage = 20 } = {}) {
  return githubFetch(`/repos/${owner}/${repo}/contributors`, {
    per_page: perPage,
  });
}

/**
 * Aggregate all key GitHub data for a repo URL/slug in one call.
 * Returns { slug, info, commits, issues, branches, pullRequests, contributors }.
 */
async function getRepoSummary(repoUrl, options = {}) {
  const slug = parseRepoSlug(repoUrl);
  if (!slug) {
    throw Object.assign(new Error("Invalid or unrecognised GitHub repo URL"), {
      statusCode: 400,
    });
  }

  const { owner, repo } = slug;

  const [info, commits, issues, branches, pullRequests, contributors] =
    await Promise.all([
      getRepoInfo(owner, repo),
      getCommits(owner, repo, { perPage: options.commitsPerPage || 15 }),
      getIssues(owner, repo, { perPage: options.issuesPerPage || 10 }),
      getBranches(owner, repo, { perPage: options.branchesPerPage || 30 }),
      getPullRequests(owner, repo, { perPage: options.prsPerPage || 10 }),
      getContributors(owner, repo, { perPage: 20 }),
    ]);

  return {
    slug: `${owner}/${repo}`,
    info,
    commits,
    issues,
    branches,
    pullRequests,
    contributors,
  };
}

/**
 * Validate that a repo URL points to an accessible GitHub repository.
 * Returns { valid: true, owner, repo } or throws with statusCode 404/400.
 */
async function validateRepo(repoUrl) {
  const slug = parseRepoSlug(repoUrl);
  if (!slug) {
    const err = new Error("Invalid GitHub repo URL or slug");
    err.statusCode = 400;
    throw err;
  }
  // This will throw if the repo doesn't exist / is private and not accessible
  await getRepoInfo(slug.owner, slug.repo);
  return slug;
}

module.exports = {
  parseRepoSlug,
  getRepoInfo,
  getCommits,
  getIssues,
  getBranches,
  getPullRequests,
  getContributors,
  getRepoSummary,
  validateRepo,
};
