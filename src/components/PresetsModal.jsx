import React from 'react';
import { X, Sparkles, Check } from 'lucide-react';

export const PRESETS = [
  {
    id: 'hormozi-viral',
    name: '🔥 Hormozi Viral Short',
    description: 'Word-by-word kinetic pop captions with yellow highlight on dark gradient.',
    config: {
      scrollMode: 'kinetic-words',
      fontFamily: 'Bebas Neue',
      fontSize: 52,
      textColor: '#ffffff',
      highlightColor: '#f59e0b',
      activeLineBg: 'rgba(245, 158, 11, 0.3)',
      bgTheme: 'animated-gradient',
      textPosition: 'center',
      speedWpm: 160
    }
  },
  {
    id: 'smooth-teleprompter',
    name: '📜 Smooth Teleprompter',
    description: 'Classic scroll with center focus reading glass box for clear reading.',
    config: {
      scrollMode: 'smooth-scroll',
      fontFamily: 'Inter',
      fontSize: 36,
      textColor: '#f8fafc',
      highlightColor: '#6366f1',
      activeLineBg: 'rgba(99, 102, 241, 0.25)',
      bgTheme: 'dark-glass',
      textPosition: 'center',
      speedWpm: 140
    }
  },
  {
    id: 'cyberpunk-neon',
    name: '⚡ Cyberpunk Neon Reel',
    description: 'Glowing cyan and magenta text with bottom news ticker marquee line.',
    config: {
      scrollMode: 'news-ticker',
      fontFamily: 'Space Grotesk',
      fontSize: 34,
      textColor: '#38bdf8',
      highlightColor: '#ec4899',
      activeLineBg: 'rgba(236, 72, 153, 0.3)',
      bgTheme: 'cyberpunk-grid',
      textPosition: 'bottom',
      speedWpm: 150
    }
  },
  {
    id: 'minimalist-podcast',
    name: '🎙️ Minimalist Podcast',
    description: 'Elegant Playfair typography with multi-line focus box and warm sunset tone.',
    config: {
      scrollMode: 'line-focus',
      fontFamily: 'Playfair Display',
      fontSize: 38,
      textColor: '#fef08a',
      highlightColor: '#f97316',
      activeLineBg: 'rgba(249, 115, 22, 0.25)',
      bgTheme: 'warm-sunset',
      textPosition: 'center',
      speedWpm: 130
    }
  },
  {
    id: 'emerald-luxury',
    name: '✨ Emerald Gold Luxury',
    description: 'Rich dark green backdrop with glowing golden dust particles and Oswald font.',
    config: {
      scrollMode: 'line-focus',
      fontFamily: 'Oswald',
      fontSize: 42,
      textColor: '#e2e8f0',
      highlightColor: '#eab308',
      activeLineBg: 'rgba(234, 179, 8, 0.25)',
      bgTheme: 'emerald-gold',
      textPosition: 'center',
      speedWpm: 145
    }
  },
  {
    id: 'corporate-clean',
    name: '💼 Corporate Clean',
    description: 'Crisp, high-legibility layout for business reels and tech news.',
    config: {
      scrollMode: 'smooth-scroll',
      fontFamily: 'Montserrat',
      fontSize: 34,
      textColor: '#ffffff',
      highlightColor: '#06b6d4',
      activeLineBg: 'rgba(6, 182, 212, 0.25)',
      bgTheme: 'solid-color',
      solidBgColor: '#0f172a',
      textPosition: 'center',
      speedWpm: 150
    }
  }
];

export default function PresetsModal({ isOpen, onClose, onSelectPreset, activePresetId }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <h2 className="text-lg font-bold flex items-center gap-2 text-white">
            <Sparkles size={20} className="text-indigo-400" />
            <span>Select Teleprompter Preset</span>
          </h2>
          <button className="text-gray-400 hover:text-white" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-2">
          {PRESETS.map(preset => {
            const isSelected = activePresetId === preset.id;
            return (
              <div
                key={preset.id}
                className={`preset-card ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  onSelectPreset(preset);
                  onClose();
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="preset-title">{preset.name}</span>
                  {isSelected && <Check size={16} className="text-indigo-400" />}
                </div>
                <span className="preset-desc">{preset.description}</span>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
