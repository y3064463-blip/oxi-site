const owner = process.env.GH_OWNER;
const repo = process.env.GH_REPO;
const branch = process.env.GH_BRANCH || 'main';
const token = process.env.GH_TOKEN;

function ensureRepoEnv() {
  return owner && repo && token;
}

async function githubRequest(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {})
    }
  });
  return res;
}

async function getContent(path) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`;
  const res = await githubRequest(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function putContent(path, message, contentBase64, sha) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const res = await githubRequest(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: contentBase64, branch, ...(sha ? { sha } : {}) })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function decodeFileContent(content) {
  return Buffer.from(content, 'base64').toString('utf8');
}

async function readJson(path, fallback) {
  const file = await getContent(path);
  if (!file || !file.content) return fallback;
  return JSON.parse(decodeFileContent(file.content));
}

async function writeJson(path, data, message) {
  const existing = await getContent(path);
  const sha = existing?.sha;
  const contentBase64 = Buffer.from(JSON.stringify(data, null, 2), 'utf8').toString('base64');
  return putContent(path, message, contentBase64, sha);
}

module.exports = { ensureRepoEnv, githubRequest, getContent, putContent, readJson, writeJson, branch, owner, repo };
