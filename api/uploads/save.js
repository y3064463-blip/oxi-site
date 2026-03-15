const { ensureRepoEnv, getContent, putContent, branch, owner, repo } = require('../_repo');
const { verifyGoogleIdToken, isAdminEmail } = require('../_auth');

function safeName(name) {
  return String(name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Only POST');
  if (!ensureRepoEnv()) return res.status(500).send('Missing GitHub env vars');

  const { idToken, fileName, mimeType, base64, size, section = 'blog' } = req.body || {};
  const user = await verifyGoogleIdToken(idToken);
  if (!user) return res.status(401).send('Unauthorized');
  if (section === 'apps' && !isAdminEmail(user.email)) return res.status(403).send('Forbidden');

  if (!fileName || !base64 || !size) return res.status(400).send('Missing upload fields');
  if (Number(size) > 150 * 1024 * 1024) return res.status(400).send('File exceeds 150MB limit');

  const folder = section === 'apps' ? 'apps' : 'blog';
  const path = `data/uploads/${folder}/${Date.now()}_${safeName(fileName)}`;

  try {
    const existing = await getContent(path);
    await putContent(path, `feat: upload ${fileName}`, base64, existing?.sha);

    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
    return res.status(200).json({ ok: true, file: { name: fileName, mimeType, size, url, path } });
  } catch (e) {
    return res.status(500).json({ error: 'upload-failed' });
  }
};
