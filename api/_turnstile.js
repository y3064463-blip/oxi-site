const DEFAULT_TURNSTILE_SECRET = '0x4AAAAAACrp-n1eXWRvmRQGMaRrKA7qwqM';

async function verifyTurnstile(token, remoteip) {
  if (!token || typeof token !== 'string') return false;

  const secret = process.env.TURNSTILE_SECRET_KEY || DEFAULT_TURNSTILE_SECRET;

  try {
    const body = new URLSearchParams({
      secret,
      response: token,
      ...(remoteip ? { remoteip } : {})
    });

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });

    if (!response.ok) return false;

    const data = await response.json();
    return Boolean(data.success);
  } catch {
    return false;
  }
}

module.exports = { verifyTurnstile };
