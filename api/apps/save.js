const { ensureRepoEnv, readJson, writeJson } = require('../_repo');
const { verifyGoogleIdToken, isAdminEmail } = require('../_auth');
const { verifyTurnstile } = require('../_turnstile');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Only POST');
  if (!ensureRepoEnv()) return res.status(500).send('Missing GitHub env vars');

  const { idToken, turnstileToken, name, description, url } = req.body || {};
  const user = await verifyGoogleIdToken(idToken);
  const turnstileOk = await verifyTurnstile(turnstileToken, req.headers['cf-connecting-ip'] || req.socket?.remoteAddress);
  if (!turnstileOk) return res.status(400).send('Turnstile doğrulaması başarısız');
  if (!user) return res.status(401).send('Unauthorized');
  if (!isAdminEmail(user.email)) return res.status(403).send('Forbidden');
  if (!name || !description || !url) return res.status(400).send('Missing fields');

  try {
    const apps = await readJson('data/apps/apps.json', []);
    const app = {
      id: `app_${Date.now()}`,
      name: String(name).slice(0, 120),
      description: String(description).slice(0, 1000),
      url: String(url).slice(0, 500),
      createdAt: new Date().toISOString()
    };
    const next = [app, ...(Array.isArray(apps) ? apps : [])];
    await writeJson('data/apps/apps.json', next, `feat: add app ${app.id}`);
    return res.status(200).json({ ok: true, app });
  } catch (e) {
    return res.status(500).json({ error: 'apps-save-failed' });
  }
};
