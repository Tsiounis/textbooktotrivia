import React, { useState, useMemo } from 'react';
import './StudyMode.css';
import { regenerateAnswer, generateFocusedCards } from './claudeApi';

const DOT_COLORS = {
  orange:  '#ff7b35',
  green:   '#3fcf6e',
  blue:    '#3fa7ff',
  magenta: '#e03fbf',
  purple:  '#9c5bf5',
  yellow:  '#f5c842',
};

const CATEGORY_LABELS = {
  orange:  'Key Terms & Definitions',
  green:   'Core Concepts',
  blue:    'Processes & Mechanisms',
  magenta: 'Real-World Applications',
  purple:  'Compare & Contrast',
  yellow:  'Cause & Effect',
};

const PAGE_SIZE = 8;

export default function StudyMode({ cards, subject, sourceText, onCardsChange, onSwitchToQuiz }) {
  const [page, setPage] = useState(0);
  const [flippedKeys, setFlippedKeys] = useState(new Set());
  const [editingKey, setEditingKey] = useState(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [answerStale, setAnswerStale] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [focusInput, setFocusInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [focusError, setFocusError] = useState('');

  // Flatten every card's pairs into one addressable list of tiles.
  const tiles = useMemo(() => {
    const flat = [];
    cards.forEach((card, cardIndex) => {
      card.pairs.forEach((pair, pairIndex) => {
        flat.push({
          key: `${cardIndex}-${pairIndex}`,
          cardIndex,
          pairIndex,
          cardNumber: card.card,
          ...pair,
        });
      });
    });
    return flat;
  }, [cards]);

  const totalPages = Math.max(1, Math.ceil(tiles.length / PAGE_SIZE));
  const pageTiles = tiles.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  function toggleFlip(key) {
    if (editingKey === key) return;
    setFlippedKeys(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function startEdit(e, tile) {
    e.stopPropagation();
    setEditingKey(tile.key);
    setEditQuestion(tile.question);
    setEditAnswer(tile.answer);
    setAnswerStale(false);
  }

  function handleQuestionEdit(value) {
    setEditQuestion(value);
    setAnswerStale(true);
  }

  async function handleRegenerate(tile) {
    setRegenerating(true);
    try {
      const newAnswer = await regenerateAnswer(editQuestion, subject, tile.category);
      setEditAnswer(newAnswer);
      setAnswerStale(false);
    } catch (err) {
      console.error('Regenerate answer failed:', err);
    } finally {
      setRegenerating(false);
    }
  }

  function handleSave(tile) {
    // Per Mauricio's feedback: an edited card replaces the old one, it does not append.
    const updatedCards = cards.map((card, ci) => {
      if (ci !== tile.cardIndex) return card;
      const updatedPairs = card.pairs.map((pair, pi) =>
        pi === tile.pairIndex ? { category: pair.category, question: editQuestion, answer: editAnswer } : pair
      );
      return { ...card, pairs: updatedPairs };
    });
    onCardsChange(updatedCards);
    setEditingKey(null);
  }

  function handleCancel() {
    setEditingKey(null);
  }

  async function handleFocusGenerate() {
    if (!focusInput.trim() || generating) return;
    if (!sourceText) {
      setFocusError('Original source text isn\u2019t available for this game (e.g. it was opened from a shared link), so a focused section can\u2019t be generated here.');
      return;
    }
    setFocusError('');
    setGenerating(true);
    try {
      const nextCardNumber = Math.max(0, ...cards.map(c => c.card)) + 1;
      const newCards = await generateFocusedCards(sourceText, subject, focusInput.trim(), nextCardNumber, 2);
      // New assumption, flagged for confirmation: focus-generated cards are appended to the deck
      // rather than replacing it, since they're additional material, not corrections.
      onCardsChange([...cards, ...newCards]);
      setFocusInput('');
      setPage(Math.floor(tiles.length / PAGE_SIZE)); // jump to the new cards
    } catch (err) {
      console.error('Focused generation failed:', err);
      setFocusError('Could not generate cards for that section. Try rephrasing it.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="study-screen">
      <div className="study-header">
        <h1 className="study-title">{subject} Pursuit</h1>
        <div className="study-mode-toggle">
          <button className="active">Study</button>
          <button onClick={onSwitchToQuiz}>Quiz</button>
        </div>
      </div>

      <div className="focus-bar">
        <input
          placeholder="Focus on a section, e.g. Sermon on the Mount"
          value={focusInput}
          onChange={e => setFocusInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleFocusGenerate()}
          disabled={generating}
        />
        <button onClick={handleFocusGenerate} disabled={generating || !focusInput.trim()}>
          {generating ? 'Generating\u2026' : 'Generate'}
        </button>
      </div>
      {focusError && <p className="focus-note">{focusError}</p>}

      <div className="study-grid">
        {pageTiles.map(tile => {
          const isFlipped = flippedKeys.has(tile.key);
          const isEditing = editingKey === tile.key;

          if (isEditing) {
            return (
              <div key={tile.key} className="study-tile is-editing">
                <span className="tile-editing-badge">Editing</span>
                <div className="tile-category" style={{ marginTop: 6 }}>
                  <span className="tile-dot" style={{ background: DOT_COLORS[tile.category] }} />
                  <span className="tile-category-label">{CATEGORY_LABELS[tile.category]}</span>
                </div>
                <textarea
                  className="tile-edit-textarea"
                  rows={3}
                  value={editQuestion}
                  onChange={e => handleQuestionEdit(e.target.value)}
                />
                <div className={`tile-edit-answer-preview ${answerStale ? 'is-stale' : ''}`}>
                  Answer: {editAnswer}{answerStale ? ' (may be stale after edit)' : ''}
                </div>
                <div className="tile-edit-actions">
                  <button
                    className="tile-regenerate-btn"
                    onClick={() => handleRegenerate(tile)}
                    disabled={regenerating || !editQuestion.trim()}
                  >
                    {regenerating ? 'Thinking\u2026' : 'Regenerate answer'}
                  </button>
                  <button className="tile-save-btn" onClick={() => handleSave(tile)}>Save</button>
                  <button className="tile-cancel-btn" onClick={handleCancel}>Cancel</button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={tile.key}
              className={`study-tile ${isFlipped ? 'is-answer' : ''}`}
              onClick={() => toggleFlip(tile.key)}
            >
              <button className="tile-edit-btn" onClick={e => startEdit(e, tile)} aria-label="Edit this card">
                {'\u270e'}
              </button>
              <div className="tile-category">
                <span className="tile-dot" style={{ background: DOT_COLORS[tile.category] }} />
                <span className="tile-category-label">{isFlipped ? 'Answer' : CATEGORY_LABELS[tile.category]}</span>
              </div>
              <p className={`tile-text ${isFlipped ? 'is-answer-text' : ''}`}>
                {isFlipped ? tile.answer : tile.question}
              </p>
              <p className="tile-hint">{isFlipped ? 'tap for question' : 'tap to reveal'}</p>
            </div>
          );
        })}
      </div>

      <div className="study-pagination">
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>{'\u2190'} Prev</button>
        <span className="study-pagination-count">
          {page * PAGE_SIZE + 1}{'\u2013'}{Math.min(tiles.length, (page + 1) * PAGE_SIZE)} of {tiles.length}
        </span>
        <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Next {'\u2192'}</button>
      </div>
    </div>
  );
}
