const { ensureRepoEnv, getContent, githubRequest, owner, repo, branch } = require('../_repo');

module.exports = async function handler(req, res) {
  if (!ensureRepoEnv()) return res.status(500).send('Missing GitHub env vars');

  try {
    const dir = await getContent('data/profiles');
    if (!Array.isArray(dir)) return res.status(200).json({ profiles: [] });

    const files = dir.filter((f) => f.type === 'file' && f.name.endsWith('.json')).slice(0, 60);
    const profiles = [];

    for (const file of files) {
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}?ref=${encodeURIComponent(branch)}`;
      const r = await githubRequest(url);
      if (!r.ok) continue;
      const data = await r.json();
      if (!data.content) continue;
      const profile = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
      if (!profile.isPrivate) {
        profiles.push({
          email: profile.email,
          name: profile.name,
          username: profile.username,
          bio: profile.bio,
          avatarUrl: profile.avatarUrl,
          coverUrl: profile.coverUrl,
          updatedAt: profile.updatedAt
        });
      }
    }

    return res.status(200).json({ profiles });
  } catch (e) {
    return res.status(500).json({ error: 'profile-list-failed' });
  }
};
