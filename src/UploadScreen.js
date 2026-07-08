import React, { useRef, useState } from 'react';
import './UploadScreen.css';

export default function UploadScreen({ onFileSelect }) {
  const inputRef = useRef();
  const [questionCount, setQuestionCount] = useState(5);

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type === 'application/pdf') onFileSelect(file, questionCount);
  }

  function handleChange(e) {
    const file = e.target.files[0];
    if (file) onFileSelect(file, questionCount);
  }

  return (
    <div className="upload-screen">
      <div className="upload-hero">
        <h1 className="hero-title">Textbook<br />to Trivia</h1>
        <p className="hero-sub">Drop any academic PDF. Get a playable card game in seconds.</p>
      </div>

      <div
        className="drop-zone"
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current.click()}
      >
        <div className="drop-icon">📄</div>
        <p className="drop-primary">Drop your textbook PDF here</p>
        <p className="drop-secondary">or click to browse</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={handleChange}
        />
      </div>

      <div className="question-count-selector">
        <p className="count-label">Number of questions</p>
        <div className="count-options">
          {[3, 5, 10].map(n => (
            <button
              key={n}
              className={`count-btn ${questionCount === n ? 'active' : ''}`}
              onClick={() => setQuestionCount(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="category-dots">
        {['#ff7b35','#3fcf6e','#3fa7ff','#e03fbf','#9c5bf5','#f5c842'].map(c => (
          <span key={c} className="preview-dot" style={{ background: c }} />
        ))}
      </div>

      <p className="upload-note">
        Works best with text-based PDFs — textbooks, lecture notes, course readers.
        First 40 pages are used.
      </p>
    </div>
  );
}
