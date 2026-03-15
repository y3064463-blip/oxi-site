const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

async function verifyGoogleIdToken(idToken) {
  if (!idToken) return null;
  const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const payload = await res.json();
  if (!payload.email || payload.email_verified !== 'true') return null;
  return {
    email: payload.email,
    name: payload.name || payload.given_name || '',
    picture: payload.picture || '',
    sub: payload.sub
  };
}

function isAdminEmail(email) {
  return Boolean(ADMIN_EMAIL) && email === ADMIN_EMAIL;
}

module.exports = { verifyGoogleIdToken, isAdminEmail };
