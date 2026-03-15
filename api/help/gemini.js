module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Only POST');

  const { question } = req.body || {};
  if (!question) return res.status(400).send('Missing question');
  if (!process.env.GEMINI_API_KEY) return res.status(500).send('Missing GEMINI_API_KEY');

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: question }] }]
      })
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).send(text || 'Gemini request failed');
    }

    const j = await r.json();
    const answer = j.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || '';
    return res.status(200).json({ answer });
  } catch (error) {
    return res.status(500).json({ error: 'gemini-request-failed' });
  }
};
