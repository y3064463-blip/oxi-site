const { ensureEnv, profilePath, getFile } = require('./_github');

module.exports = async function handler(req, res) {
  if (!ensureEnv()) return res.status(500).send('Missing GitHub env vars');

  const email = req.query?.email;
  if (!email) return res.status(400).send('Missing email');

  try {
    const file = await getFile(profilePath(email));
    if (!file || !file.content) return res.status(404).send('Not found');

    const json = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
    return res.status(200).json(json);
  } catch (error) {
    return res.status(404).send('Not found');
  }
};
