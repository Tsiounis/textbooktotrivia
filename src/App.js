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

function getOrCreateVisitorId() {
  let id = localStorage.getItem('ttt_visitor_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('ttt_visitor_id', id);
  }
  return id;
}

function selectQuestions(cards, count = 5) {
  return cards.slice(0, count).map(card => {
    const randomPair = card.pairs[Math.floor(Math.random() * card.pairs.length)];
    return { cardNumber: card.card, ...randomPair };
  });
}

export default function App() {
  const [phase, setPhase] = useState(STATES.UPLOAD);
  const [cards, setCards] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [subject, setSubject] = useState('');
  const [filename, setFilename] = useState('');
  const [error, setError] = useState('');
  const [gameId, setGameId] = useState(null);
  const [finalScore, setFinalScore] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);

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
        setQuestions(data.questions);
        setPhase(STATES.QUIZ);

        // Fire-and-forget: track that this shared link was opened, to measure
        // organic reach (visits beyond the people we directly sent it to).
        // Never blocks the game and never breaks it if this fails.
        supabase
          .from('link_visits')
          .insert({ game_id: data.id, visitor_id: getOrCreateVisitorId() })
          .then(({ error: visitError }) => {
            if (visitError) console.warn('Visit tracking failed (non-blocking):', visitError);
          });
      } else {
        throw new Error('Game not found.');
      }
    } catch (err) {
      setError(err.message || 'Could not load shared game.');
      setPhase(STATES.ERROR);
    }
  }

  async function handleFileSelect(file, questionCount = 5) {
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
      const selectedQuestions = selectQuestions(generatedCards, questionCount);

      const { data, error: dbError } = await supabase
        .from('games')
        .insert({ subject: detectedSubject, cards: generatedCards, questions: selectedQuestions })
        .select()
        .single();

      if (dbError) throw dbError;

      setCards(generatedCards);
      setQuestions(selectedQuestions);
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

  function handleNewGame() {
    // "New Game" means a fresh random draw from the material already loaded
    // (whether that came from an upload or a shared link like Nick's), not
    // a full reset back to the PDF upload screen -- there's no PDF to give
    // it back in a shared-link session, so that used to be a dead end.
    const freshQuestions = selectQuestions(cards, questions.length);
    setQuestions(freshQuestions);
    setFinalScore(0);
    setFinalTotal(0);
    setPhase(STATES.QUIZ);
  }

  function handleReset() {
    setPhase(STATES.UPLOAD);
    setCards(null);
    setQuestions(null);
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
      questions={questions}
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
      onReset={handleNewGame}
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
