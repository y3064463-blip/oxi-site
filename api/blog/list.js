const { ensureRepoEnv, readJson } = require('../_repo');

module.exports = async function handler(req, res) {
  if (!ensureRepoEnv()) return res.status(500).send('Missing GitHub env vars');
  try {
    const posts = await readJson('data/blog/posts.json', []);
    return res.status(200).json({ posts: Array.isArray(posts) ? posts : [] });
  } catch (e) {
    return res.status(500).json({ error: 'blog-list-failed' });
  }
};
