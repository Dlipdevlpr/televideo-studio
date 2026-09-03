import React from 'react';
import { Video, Download, Layers } from 'lucide-react';

export default function Navbar({ onOpenPresets, onExport, isExporting, isRecording, aspectRatio, setAspectRatio }) {
  return (
    <header className="navbar">
      <div className="brand-logo">
        <Video className="brand-icon" size={22} />
        <span className="brand-title">TeleVideo <span className="brand-badge">Studio</span></span>
      </div>

      {/* Aspect Ratio Selector Pills - Desktop only */}
      <div className="aspect-pills desktop-only">
        <button
          className={`aspect-pill ${aspectRatio === '9:16' ? 'active' : ''}`}
          onClick={() => setAspectRatio('9:16')}
        >
          📱 9:16 (Shorts/Reels)
        </button>
        <button
          className={`aspect-pill ${aspectRatio === '16:9' ? 'active' : ''}`}
          onClick={() => setAspectRatio('16:9')}
        >
          📺 16:9 (YouTube)
        </button>
        <button
          className={`aspect-pill ${aspectRatio === '1:1' ? 'active' : ''}`}
          onClick={() => setAspectRatio('1:1')}
        >
          🔲 1:1 (Post)
        </button>
      </div>

      <div className="nav-actions">
        <button className="btn btn-secondary btn-sm nav-btn" onClick={onOpenPresets} title="Presets">
          <Layers size={16} />
          <span className="btn-text">Presets</span>
        </button>

        <button 
          className="btn btn-accent btn-sm nav-btn export-btn"
          onClick={onExport}
          disabled={isExporting || isRecording}
          title="Export Video"
        >
          <Download size={16} />
          <span className="btn-text">{isExporting ? 'Exporting...' : 'Export Video'}</span>
        </button>
      </div>
    </header>
  );
}

