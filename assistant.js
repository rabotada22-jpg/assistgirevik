// Vercel serverless endpoint for the Academy assistant.
// Configure OPENAI_API_KEY and ALLOWED_ORIGIN in Vercel Project Settings > Environment Variables.
export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '';
  if (!allowedOrigin) return res.status(503).json({ error: 'Assistant origin is not configured' });
  if (origin !== allowedOrigin) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'Assistant is not configured' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const question = String(body.question || '').trim().slice(0, 500);
    const incoming = body.profile && typeof body.profile === 'object' ? body.profile : {};
    const allowedProfileKeys = ['gender','experience','bells','goal','discipline','gear','control','recommended'];
    const profile = Object.fromEntries(allowedProfileKeys.filter(key => typeof incoming[key] === 'string').map(key => [key, incoming[key].slice(0, 80)]));
    if (!question) return res.status(400).json({ error: 'Question is required' });

    const system = `Ты — консультант онлайн-академии гиревых тренировок. Отвечай по-русски, коротко и доброжелательно. Используй анкету посетителя и только этот каталог: Функциональный тренинг 1.0, Комбинированный тренинг, Гиревая качалка, Функциональный тренинг 2.0, курсы освоения техники толчка, рывка и длинного цикла, набор «Гиревик», подготовка к соревнованиям, подготовка тренеров. Продвинутый уровень пока в разработке. Объясняй рекомендацию через цель, тренировочный стаж, непрерывность занятий и опыт с гирями. Пол можно учитывать как контекст, но никогда не определяй вес гири только по полу. При подборе веса сначала уточняй упражнение и гири, доступные человеку; рекомендуй проверить самый лёгкий подходящий вес на 5 контролируемых повторениях после разминки. Не назначай точный вес для соревновательного толчка, рывка или длинного цикла без тренера и оценки техники. Не диагностируй травмы и не советуй тренироваться через боль. Если данных мало, задай один конкретный уточняющий вопрос. Не придумывай цены, сроки и содержание курсов.`;
    const userInput = JSON.stringify({ question, answers: profile });
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5-mini',
        instructions: system,
        input: userInput,
        max_output_tokens: 350,
        store: false
      })
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('OpenAI response error:', response.status, data.error?.type || 'unknown');
      return res.status(502).json({ error: 'AI provider request failed' });
    }
    const answer = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === 'output_text')
      .map(item => item.text)
      .join('\n')
      .trim();
    if (!answer) return res.status(502).json({ error: 'Empty AI response' });
    return res.status(200).json({ answer });
  } catch (error) {
    console.error('Academy assistant error:', error.message);
    return res.status(500).json({ error: 'Unexpected assistant error' });
  }
}
