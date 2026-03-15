const { ensureRepoEnv, getContent } = require('../_repo');
const { verifyGoogleIdToken } = require('../_auth');

function profilePath(email) {
  return `data/profiles/${encodeURIComponent(email)}.json`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Only POST');
  if (!ensureRepoEnv()) return res.status(500).send('Missing GitHub env vars');

  const { idToken, email } = req.body || {};
  const user = await verifyGoogleIdToken(idToken);
  if (!user) return res.status(401).send('Unauthorized');

  const targetEmail = email || user.email;

  try {
    const file = await getContent(profilePath(targetEmail));
    if (!file || !file.content) return res.status(404).send('Not found');

    const profile = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
    const isOwner = user.email === targetEmail;
    if (profile.isPrivate && !isOwner) return res.status(403).send('Private profile');

    return res.status(200).json(profile);
  } catch (error) {
    return res.status(404).send('Not found');
  }
};
