import React, { useState, useEffect } from 'react';
import UploadScreen from './UploadScreen';
import LoadingScreen from './LoadingScreen';
import QuizScreen from './QuizScreen';
import ResultsScreen from './ResultsScreen';
import { extractTextFromPDF } from './pdfExtractor';
import { generateTrivia, detectSubject } from './claudeApi';
import { supabase } from './supabaseClient';

const STATES = {
  UPLOAD: 'upload',
  LOADING: 'loading',
  QUIZ: 'quiz',
  RESULTS: 'results',
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
  const [gameId, setGameId] = useState(null);
  const [finalScore, setFinalScore] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);

  // Check for shared game link on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedGameId = params.get('game');
    if (sharedGameId) {
      loadSharedGame(sharedGameId);
    }
  }, []);

  async function loadSharedGame(id) {
    setPhase(STATES.LOADING);
    try {
      const { data } = await supabase
        .from('games')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        setCards(data.cards);
        setSubject(data.subject);
        setGameId(data.id);
        setPhase(STATES.QUIZ);
      } else {
        throw new Error('Game not found.');
      }
    } catch (err) {
      setError(err.message || 'Could not load shared game.');
      setPhase(STATES.ERROR);
    }
  }

  async function handleFileSelect(file) {
    setFilename(file.name);
    setPhase(STATES.LOADING);

    try {
      const text = await extractTextFromPDF(file);
      if (text.trim().length < 200) {
        throw new Error('Not enough readable text. Try a text-based PDF.');
      }

      const detectedSubject = await detectSubject(text);
      setSubject(detectedSubject);

      const generatedCards = await generateTrivia(text, detectedSubject);

      // Save game to Supabase
      const { data, error: dbError } = await supabase
        .from('games')
        .insert({ subject: detectedSubject, cards: generatedCards })
        .select()
        .single();

      if (dbError) throw dbError;

      setCards(generatedCards);
      setGameId(data.id);
      setPhase(STATES.QUIZ);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong. Try a different PDF.');
      setPhase(STATES.ERROR);
    }
  }

  function handleQuizComplete(score, total) {
    setFinalScore(score);
    setFinalTotal(total);
    setPhase(STATES.RESULTS);
  }

  function handleReplay() {
    setPhase(STATES.QUIZ);
  }

  function handleReset() {
    setPhase(STATES.UPLOAD);
    setCards(null);
    setSubject('');
    setFilename('');
    setError('');
    setGameId(null);
    setFinalScore(0);
    setFinalTotal(0);
    window.history.pushState({}, '', '/');
  }

  if (phase === STATES.UPLOAD) return <UploadScreen onFileSelect={handleFileSelect} />;
  if (phase === STATES.LOADING) return <LoadingScreen filename={filename} />;
  if (phase === STATES.QUIZ) return (
    <QuizScreen
      cards={cards}
      subject={subject}
      gameId={gameId}
      onComplete={handleQuizComplete}
    />
  );
  if (phase === STATES.RESULTS) return (
    <ResultsScreen
      score={finalScore}
      total={finalTotal}
      gameId={gameId}
      subject={subject}
      onReset={handleReset}
      onReplay={handleReplay}
    />
  );

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
