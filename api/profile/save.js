const { ensureRepoEnv, writeJson } = require('../_repo');
const { verifyGoogleIdToken } = require('../_auth');

function profilePath(email) {
  return `data/profiles/${encodeURIComponent(email)}.json`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Only POST');
  if (!ensureRepoEnv()) return res.status(500).send('Missing GitHub env vars');

  const { idToken, profile } = req.body || {};
  const user = await verifyGoogleIdToken(idToken);
  if (!user) return res.status(401).send('Unauthorized');
  if (!profile) return res.status(400).send('Missing profile');

  const nextProfile = {
    email: user.email,
    name: String(profile.name || user.name || '').slice(0, 80),
    username: String(profile.username || '').replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 30),
    bio: String(profile.bio || '').slice(0, 300),
    avatarUrl: String(profile.avatarUrl || '').slice(0, 2000),
    coverUrl: String(profile.coverUrl || '').slice(0, 2000),
    isPrivate: Boolean(profile.isPrivate),
    updatedAt: new Date().toISOString()
  };

  try {
    await writeJson(profilePath(user.email), nextProfile, `feat: update profile ${user.email}`);
    return res.status(200).json({ ok: true, profile: nextProfile });
  } catch (error) {
    return res.status(500).json({ error: 'save-failed' });
  }
};
