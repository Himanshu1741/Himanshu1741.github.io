exports.getCommits = async (owner, repo) => {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "student-collab-hub"
      }
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return response.json();
};
