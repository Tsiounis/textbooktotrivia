import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './ResultsScreen.css';

export default function ResultsScreen({ score, total, gameId, subject, onReset, onReplay }) {
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingBoard, setLoadingBoard] = useState(true);
  const shareUrl = `${window.location.origin}?game=${gameId}`;

  useEffect(() => {
    fetchLeaderboard();
  }, [gameId]);

  async function fetchLeaderboard() {
    setLoadingBoard(true);
    const { data } = await supabase
      .from('scores')
      .select('player_name, score, total')
      .eq('game_id', gameId)
      .order('score', { ascending: false })
      .limit(10);
    setLeaderboard(data || []);
    setLoadingBoard(false);
  }

  async function handleSubmitScore() {
    if (!playerName.trim() || submitting) return;
    setSubmitting(true);
    await supabase.from('scores').insert({
      game_id: gameId,
      player_name: playerName.trim(),
      score,
      total
    });
    setSubmitted(true);
    setSubmitting(false);
    fetchLeaderboard();
  }

  function handleShare() {
    const text = `I scored ${score}/${total} on ${subject} Pursuit! Can you beat me? ${shareUrl}`;
    if (navigator.share) {
      navigator.share({ title: `${subject} Pursuit`, text, url: shareUrl });
    } else {
      navigator.clipboard.writeText(text);
      alert('Challenge link copied to clipboard!');
    }
  }

  const percentage = Math.round((score / total) * 100);

  return (
    <div className="results-screen">
      <h1 className="results-title">{subject} Pursuit</h1>

      <div className="score-display">
        <div className="score-big">{score}<span className="score-total">/{total}</span></div>
        <div className="score-percent">{percentage}%</div>
        <div className="score-label">
          {percentage === 100 ? 'Perfect!' : percentage >= 70 ? 'Great job!' : percentage >= 50 ? 'Good effort!' : 'Keep studying!'}
        </div>
      </div>

      {!submitted ? (
        <div className="name-entry">
          <p className="name-label">Enter your name for the leaderboard</p>
          <input
            className="name-input"
            type="text"
            placeholder="Your name"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmitScore()}
            maxLength={20}
          />
          <button
            className="submit-score-btn"
            onClick={handleSubmitScore}
            disabled={!playerName.trim() || submitting}
          >
            {submitting ? 'Saving...' : 'Save Score'}
          </button>
        </div>
      ) : (
        <p className="score-saved">Score saved!</p>
      )}

      <button className="share-btn" onClick={handleShare}>
        Challenge a Friend →
      </button>

      <div className="leaderboard">
        <h2 className="leaderboard-title">Leaderboard</h2>
        {loadingBoard ? (
          <p className="board-loading">Loading...</p>
        ) : leaderboard.length === 0 ? (
          <p className="board-empty">No scores yet. Be the first!</p>
        ) : (
          <div className="board-list">
            {leaderboard.map((entry, i) => (
              <div className="board-row" key={i}>
                <span className="board-rank">{i + 1}</span>
                <span className="board-name">{entry.player_name}</span>
                <span className="board-score">{entry.score}/{entry.total}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="results-actions">
        <button className="replay-btn" onClick={onReplay}>Play Again</button>
        <button className="new-game-btn" onClick={onReset}>New Game</button>
      </div>
    </div>
  );
}
