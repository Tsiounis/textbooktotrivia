const CATEGORY_COLORS = ['orange', 'green', 'blue', 'magenta', 'purple', 'yellow'];

export async function generateTrivia(text, subject) {
  const prompt = `You are a trivia card game designer. Given the academic textbook excerpt below, generate exactly 10 trivia cards in the style of Trivial Pursuit. Each card has 6 questions — one per category.

Subject: "${subject}"

Categories (use exactly these 6 for every card, in this order):
1. orange  — Key Terms & Definitions
2. green   — Core Concepts
3. blue    — Processes & Mechanisms
4. magenta — Real-World Applications
5. purple  — Compare & Contrast
6. yellow  — Cause & Effect

Rules:
- Questions must come ONLY from the main subject matter of the text. Completely ignore any author biography, preface, acknowledgements, introduction, or personal anecdotes.
- Only generate questions with factually verifiable, unambiguous answers. Do not ask about opinions, interpretations, or speculative claims.
- Each question must be one tight, grammatically complete sentence.
- Each answer must be under 12 words. Precise and unambiguous.
- Vary difficulty across cards (cards 1-3 easier, 7-10 harder).
- Do NOT use quotation marks around answers.

Return ONLY a JSON array, no markdown, no preamble:
[
  {
    "card": 1,
    "pairs": [
      { "category": "orange", "question": "...", "answer": "..." },
      { "category": "green",  "question": "...", "answer": "..." },
      { "category": "blue",   "question": "...", "answer": "..." },
      { "category": "magenta","question": "...", "answer": "..." },
      { "category": "purple", "question": "...", "answer": "..." },
      { "category": "yellow", "question": "...", "answer": "..." }
    ]
  }
]

Textbook excerpt:
${text}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.REACT_APP_ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 6000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const data = await response.json();
  const raw = data.content?.[0]?.text || '';
  const clean = raw.replace(/```json|```/g, '').trim();
  const cards = JSON.parse(clean);

  return cards;
}

export { CATEGORY_COLORS };
