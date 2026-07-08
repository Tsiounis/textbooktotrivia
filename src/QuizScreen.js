import React, { useState, useMemo } from 'react';
import './QuizScreen.css';

const DOT_COLORS = {
  orange:  '#ff7b35',
  green:   '#3fcf6e',
  blue:    '#3fa7ff',
  magenta: '#e03fbf',
  purple:  '#9c5bf5',
  yellow:  '#f5c842',
};

export default function QuizScreen({ cards, questions: preselectedQuestions, subject, gameId, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [judging, setJudging] = useState(false);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const questions = useMemo(() => {
    if (preselectedQuestions && preselectedQuestions.length > 0) {
      return preselectedQuestions;
    }
    return cards.map(card => {
      const randomPair = card.pairs[Math.floor(Math.random() * card.pairs.length)];
      return { cardNumber: card.card, ...randomPair };
    });
  }, [cards, preselectedQuestions]);

  const current = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  async function handleSubmit() {
    if (!answer.trim() || judging) return;
    setJudging(true);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.REACT_APP_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 100,
          messages: [{
            role: 'user',
            content: `You are a strict but fair trivia judge. The official answer is: "${current.answer}". The student answered: "${answer}".

Accept if: the core concept is correct, even if incomplete. Accept synonyms, paraphrasing, or answers that name the key thing without the surrounding words.
Reject if: the answer is factually wrong, names the wrong thing entirely, or is too vague to demonstrate understanding.

Reply with ONLY a JSON object: {"correct": true} or {"correct": false}`
          }]
        })
      });

      const data = await response.json();
      const raw = data.content?.[0]?.text || '{"correct": false}';
      const clean = raw.replace(/```json|```/g, '').trim();
      const judgment = JSON.parse(clean);

      const isCorrect = judgment.correct;
      if (isCorrect) setScore(s => s + 1);
      setResult({ correct: isCorrect, officialAnswer: current.answer });
      setFlipped(true);
    } catch (err) {
      console.error('Judge error:', err);
      setResult({ correct: false, officialAnswer: current.answer });
      setFlipped(true);
    } finally {
      setJudging(false);
    }
  }

  function handleNext() {
    if (isLast) {
      onComplete(score, questions.length);
    } else {
      setCurrentIndex(i => i + 1);
      setAnswer('');
      setResult(null);
      setFlipped(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (!result) handleSubmit();
    }
  }

  const progress = (currentIndex / questions.length) * 100;

  return (
    <div className="quiz-screen">
      <div className="quiz-header">
        <h1 className="quiz-title">{subject} Pursuit</h1>
        <span className="quiz-score">Score: {score}/{currentIndex + (result ? 1 : 0)}</span>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="quiz-counter">{currentIndex + 1} / {questions.length}</div>

      <div className={`quiz-card ${flipped ? 'flipped' : ''}`}>
        <div className="quiz-card-inner">
          <div className="quiz-card-front">
            <div className="quiz-category">
              <span className="dot" style={{ background: DOT_COLORS[current.category] }} />
              <span>{current.category.toUpperCase()}</span>
            </div>
            <p className="quiz-question">{current.question}</p>
            <input
              className="quiz-input"
              type="text"
              placeholder="Type your answer..."
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={judging || !!result}
              autoFocus
            />
            <button
              className="quiz-submit"
              onClick={handleSubmit}
              disabled={judging || !!result || !answer.trim()}
            >
              {judging ? 'Judging...' : 'Submit'}
            </button>
          </div>

          <div className="quiz-card-back">
            <div className={`result-badge ${result?.correct ? 'correct' : 'incorrect'}`}>
              {result?.correct ? '✓ Correct!' : '✗ Not quite'}
            </div>
            <div className="official-answer">
              <p className="official-label">Official answer:</p>
              <p className="official-text">{result?.officialAnswer}</p>
            </div>
            <div className="your-answer">
              <p className="your-label">Your answer:</p>
              <p className="your-text">{answer}</p>
            </div>
            <button className="quiz-next" onClick={handleNext}>
              {isLast ? 'See Results →' : 'Next Question →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
