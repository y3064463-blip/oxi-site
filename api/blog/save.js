const { ensureRepoEnv, readJson, writeJson } = require('../_repo');
const { verifyGoogleIdToken } = require('../_auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Only POST');
  if (!ensureRepoEnv()) return res.status(500).send('Missing GitHub env vars');

  const { idToken, title, content, media = [] } = req.body || {};
  const user = await verifyGoogleIdToken(idToken);
  if (!user) return res.status(401).send('Unauthorized');
  if (!title || !content) return res.status(400).send('Missing title/content');

  const totalBytes = media.reduce((sum, m) => sum + (Number(m.size) || 0), 0);
  if (totalBytes > 150 * 1024 * 1024) return res.status(400).send('Post exceeds 150MB limit');

  try {
    const posts = await readJson('data/blog/posts.json', []);
    const newPost = {
      id: `post_${Date.now()}`,
      title: String(title).slice(0, 160),
      content: String(content).slice(0, 5000),
      media,
      author: { email: user.email, name: user.name },
      createdAt: new Date().toISOString()
    };
    const next = [newPost, ...(Array.isArray(posts) ? posts : [])];
    await writeJson('data/blog/posts.json', next, `feat: add blog post ${newPost.id}`);
    return res.status(200).json({ ok: true, post: newPost });
  } catch (e) {
    return res.status(500).json({ error: 'blog-save-failed' });
  }
};
