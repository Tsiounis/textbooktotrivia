import React, { useState } from 'react';
import './TriviaCard.css';

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

export default function TriviaCard({ card, cardNumber, subject }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="card-scene" onClick={() => setFlipped(f => !f)}>
      <div className={`card-body ${flipped ? 'is-flipped' : ''}`}>

        <div className="card-face card-front">
          <div className="card-header">
            <span className="card-label">{subject} Pursuit</span>
            <span className="card-number">Card {cardNumber}</span>
          </div>
          <div className="card-rows">
            {card.pairs.map((pair, i) => (
              <div className="card-row" key={i}>
                <span
                  className="dot"
                  style={{ background: DOT_COLORS[pair.category] }}
                />
                <span className="row-category">{CATEGORY_LABELS[pair.category]}</span>
                <span className="row-text">{pair.question}</span>
              </div>
            ))}
          </div>
          <div className="card-flip-hint">tap to reveal answers</div>
        </div>

        <div className="card-face card-back">
          <div className="card-header">
            <span className="card-label answer-label">Answers</span>
            <span className="card-number">Card {cardNumber}</span>
          </div>
          <div className="card-rows">
            {card.pairs.map((pair, i) => (
              <div className="card-row" key={i}>
                <span
                  className="dot"
                  style={{ background: DOT_COLORS[pair.category] }}
                />
                <span className="row-text answer-text">{pair.answer}</span>
              </div>
            ))}
          </div>
          <div className="card-flip-hint">tap to see questions</div>
        </div>

      </div>
    </div>
  );
}
