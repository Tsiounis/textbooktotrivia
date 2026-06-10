import React, { useState } from 'react';
import TriviaCard from './TriviaCard';
import './GameScreen.css';

export default function GameScreen({ cards, subject, onReset }) {
  const [activeCard, setActiveCard] = useState(0);

  return (
    <div className="game-screen">
      <div className="game-header">
        <h1 className="game-title">{subject} Pursuit</h1>
        <button className="reset-btn" onClick={onReset}>New Game</button>
      </div>

      <div className="card-nav">
        {cards.map((_, i) => (
          <button
            key={i}
            className={`nav-pip ${i === activeCard ? 'active' : ''}`}
            onClick={() => setActiveCard(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className="card-area">
        <TriviaCard
          card={cards[activeCard]}
          cardNumber={activeCard + 1}
          subject={subject}
        />
      </div>

      <div className="card-arrows">
        <button
          className="arrow-btn"
          disabled={activeCard === 0}
          onClick={() => setActiveCard(i => i - 1)}
        >
          ← Prev
        </button>
        <span className="card-counter">{activeCard + 1} / {cards.length}</span>
        <button
          className="arrow-btn"
          disabled={activeCard === cards.length - 1}
          onClick={() => setActiveCard(i => i + 1)}
        >
          Next →
        </button>
      </div>

      <p className="game-hint">Tap a card to flip between questions and answers.</p>
    </div>
  );
}
