import React, { useState } from 'react';
import UploadScreen from './UploadScreen';
import LoadingScreen from './LoadingScreen';
import GameScreen from './GameScreen';
import { extractTextFromPDF } from './pdfExtractor';
import { generateTrivia } from './claudeApi';

const STATES = {
  UPLOAD: 'upload',
  LOADING: 'loading',
  GAME: 'game',
  ERROR: 'error',
};

function guessSubject(filename) {
  const name = filename.toLowerCase().replace(/\.pdf$/, '');
  const words = name.split(/[\s_\-]+/);
  const stop = new Set(['the','a','an','of','and','for','to','in','on','by','with']);
  const subject = words.find(w => !stop.has(w)) || words[0];
  return subject.charAt(0).toUpperCase() + subject.slice(1);
}

export default function App() {
  const [phase, setPhase] = useState(STATES.UPLOAD);
  const [cards, setCards] = useState(null);
  const [subject, setSubject] = useState('');
  const [filename, setFilename] = useState('');
  const [error, setError] = useState('');

  async function handleFileSelect(file) {
    setFilename(file.name);
    setPhase(STATES.LOADING);

    try {
      const text = await extractTextFromPDF(file);
      if (text.trim().length < 200) {
        throw new Error('Not enough readable text. This might be a scanned PDF — try a text-based one.');
      }

      const detectedSubject = guessSubject(file.name);
      setSubject(detectedSubject);

      const generatedCards = await generateTrivia(text, detectedSubject);
      setCards(generatedCards);
      setPhase(STATES.GAME);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong. Try a different PDF.');
      setPhase(STATES.ERROR);
    }
  }

  function handleReset() {
    setPhase(STATES.UPLOAD);
    setCards(null);
    setSubject('');
    setFilename('');
    setError('');
  }

  if (phase === STATES.UPLOAD) return <UploadScreen onFileSelect={handleFileSelect} />;
  if (phase === STATES.LOADING) return <LoadingScreen filename={filename} />;
  if (phase === STATES.GAME) return <GameScreen cards={cards} subject={subject} onReset={handleReset} />;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', gap: 24, padding: '40px 24px',
      textAlign: 'center'
    }}>
      <p style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 32, color: '#e03fbf' }}>
        Couldn't generate your game
      </p>
      <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 360, lineHeight: 1.5 }}>
        {error}
      </p>
      <button
        onClick={handleReset}
        style={{
          background: 'rgba(123,63,228,0.2)', border: '1px solid #7b3fe4',
          color: '#fff', borderRadius: 8, padding: '10px 24px',
          fontWeight: 600, fontSize: 14, cursor: 'pointer'
        }}
      >
        Try again
      </button>
    </div>
  );
}
