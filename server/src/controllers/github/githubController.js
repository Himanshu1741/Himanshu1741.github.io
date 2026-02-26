const { getCommits } = require("../../services/githubService");

exports.fetchGithubData = async (req, res) => {
  const { owner, repo } = req.params;

  const commits = await getCommits(owner, repo);

  res.json(commits);
};
