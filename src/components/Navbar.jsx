import React from 'react';
import { Video, Sparkles, Download, Layers } from 'lucide-react';

export default function Navbar({ onOpenPresets, onExport, isExporting, isRecording, aspectRatio, setAspectRatio }) {
  return (
    <header className="navbar">
      <div className="brand-logo">
        <Video className="w-6 h-6 text-indigo-400" size={24} />
        <span>TeleVideo <span className="brand-badge">Studio</span></span>
      </div>

      {/* Aspect Ratio Selector Pills */}
      <div className="aspect-pills hidden md:flex">
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
        <button className="btn btn-secondary btn-sm" onClick={onOpenPresets}>
          <Layers size={16} />
          <span>Presets</span>
        </button>

        <button 
          className="btn btn-accent btn-sm"
          onClick={onExport}
          disabled={isExporting || isRecording}
        >
          <Download size={16} />
          <span>{isExporting ? 'Exporting Video...' : 'Export Video'}</span>
        </button>
      </div>
    </header>
  );
}
