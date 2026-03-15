const owner = process.env.GH_OWNER;
const repo = process.env.GH_REPO;
const branch = process.env.GH_BRANCH || 'main';
const token = process.env.GH_TOKEN;
const basePath = 'data/profiles';

function ensureEnv() {
  return owner && repo && token;
}

function profilePath(email) {
  return `${basePath}/${encodeURIComponent(email)}.json`;
}

async function getFile(path) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`;
  const r = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

  if (r.status === 404) return null;
  if (!r.ok) {
    const text = await r.text();
    throw new Error(text || 'github-read-failed');
  }

  return r.json();
}

async function saveFile(path, message, contentBase64, sha) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const r = await fetch(url, {
    method: 'PUT',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      content: contentBase64,
      branch,
      ...(sha ? { sha } : {})
    })
  });

  if (!r.ok) {
    const text = await r.text();
    throw new Error(text || 'github-save-failed');
  }

  return r.json();
}

module.exports = {
  ensureEnv,
  profilePath,
  getFile,
  saveFile
};
