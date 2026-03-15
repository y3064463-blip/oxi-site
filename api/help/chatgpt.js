module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Only POST');

  const { question } = req.body || {};
  if (!question) return res.status(400).send('Missing question');
  if (!process.env.OPENAI_API_KEY) return res.status(500).send('Missing OPENAI_API_KEY');

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: question }]
      })
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).send(text || 'OpenAI request failed');
    }

    const j = await r.json();
    return res.status(200).json({ answer: j.choices?.[0]?.message?.content ?? '' });
  } catch (error) {
    return res.status(500).json({ error: 'chatgpt-request-failed' });
  }
};
