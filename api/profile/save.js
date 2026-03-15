const { ensureEnv, profilePath, getFile, saveFile } = require('./_github');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Only POST');
  if (!ensureEnv()) return res.status(500).send('Missing GitHub env vars');

  const { email, profile } = req.body || {};
  if (!email || !profile) return res.status(400).send('Missing payload');

  const path = profilePath(email);
  const content = Buffer.from(JSON.stringify(profile, null, 2), 'utf8').toString('base64');

  try {
    const existing = await getFile(path);
    const sha = existing?.sha;

    await saveFile(path, `chore: update profile ${email}`, content, sha);
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: 'save-failed' });
  }
};
