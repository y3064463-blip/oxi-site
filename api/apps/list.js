const { ensureRepoEnv, readJson } = require('../_repo');

module.exports = async function handler(req, res) {
  if (!ensureRepoEnv()) return res.status(500).send('Missing GitHub env vars');
  try {
    const apps = await readJson('data/apps/apps.json', []);
    return res.status(200).json({ apps: Array.isArray(apps) ? apps : [] });
  } catch (e) {
    return res.status(500).json({ error: 'apps-list-failed' });
  }
};
