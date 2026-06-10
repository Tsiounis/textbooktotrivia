import React, { useEffect, useState } from 'react';
import './LoadingScreen.css';

const STEPS = [
  'Reading your textbook…',
  'Identifying key concepts…',
  'Designing trivia questions…',
  'Setting up your card game…',
];

export default function LoadingScreen({ filename }) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex(i => Math.min(i + 1, STEPS.length - 1));
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-screen">
      <div className="loading-dots">
        {['#ff7b35','#3fcf6e','#3fa7ff','#e03fbf','#9c5bf5','#f5c842'].map((c, i) => (
          <span
            key={c}
            className="pulse-dot"
            style={{ background: c, animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <p className="loading-filename">{filename}</p>
      <p className="loading-step">{STEPS[stepIndex]}</p>
    </div>
  );
}
