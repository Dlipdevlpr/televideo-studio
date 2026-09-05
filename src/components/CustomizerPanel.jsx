import React, { useState } from 'react';
import { Sliders, Type, Palette, Eye, Layout, Square, Music, Volume2, Upload, Disc, Play } from 'lucide-react';
import { BGM_PRESETS } from '../utils/bgmData';
import { speechManager } from '../utils/speechManager';

export default function CustomizerPanel({
  scrollMode,
  setScrollMode,
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
  textColor,
  setTextColor,
  highlightColor,
  setHighlightColor,
  activeLineBg,
  setActiveLineBg,
  bgTheme,
  setBgTheme,
  solidBgColor,
  setSolidBgColor,
  textPosition,
  setTextPosition,
  speedWpm,
  setSpeedWpm,
  showProgressBar,
  setShowProgressBar,
  showAudioVisualizer,
  setShowAudioVisualizer,
  watermarkText,
  setWatermarkText,
  showWatermark,
  setShowWatermark,

  // Reading Focus Box Controls
  showReadingBox,
  setShowReadingBox,
  boxScale,
  setBoxScale,
  boxWidthPercent,
  setBoxWidthPercent,
  boxBorderRadius,
  setBoxBorderRadius,
  boxBorderWidth,
  setBoxBorderWidth,

  // Background Music Controls
  bgmTrackId,
  setBgmTrackId,
  bgmVolume,
  setBgmVolume,
  customBgmFile,
  setCustomBgmFile
}) {
  const [activeTab, setActiveTab] = useState('mode');
  const [isPreviewingBgm, setIsPreviewingBgm] = useState(false);

  const handleTogglePreview = async (trackId = bgmTrackId) => {
    if (isPreviewingBgm) {
      speechManager.stopBgm();
      setIsPreviewingBgm(false);
    } else {
      if (trackId === 'none') return;
      const src = (trackId === 'custom' && customBgmFile) ? customBgmFile : null;
      await speechManager.playBgm(src, bgmVolume, trackId);
      setIsPreviewingBgm(true);
    }
  };

  const handleSelectTrack = async (newTrackId) => {
    setBgmTrackId(newTrackId);
    if (isPreviewingBgm) {
      if (newTrackId === 'none') {
        speechManager.stopBgm();
        setIsPreviewingBgm(false);
      } else {
        const src = (newTrackId === 'custom' && customBgmFile) ? customBgmFile : null;
        await speechManager.playBgm(src, bgmVolume, newTrackId);
      }
    }
  };

  const handleVolumeChange = (newVol) => {
    setBgmVolume(newVol);
    speechManager.setBgmVolume(newVol);
  };

  return (
    <div className="panel panel-right">
      <div className="panel-header">
        <span className="panel-title">
          <Sliders size={18} className="text-indigo-400" />
          <span>Teleprompter Styling</span>
        </span>
      </div>

      <div className="panel-body">
        {/* Navigation Tabs */}
        <div className="tabs-header">
          <button
            className={`tab-btn ${activeTab === 'mode' ? 'active' : ''}`}
            onClick={() => setActiveTab('mode')}
          >
            <Layout size={14} />
            <span>Mode</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'box' ? 'active' : ''}`}
            onClick={() => setActiveTab('box')}
          >
            <Square size={14} />
            <span>Box</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => setActiveTab('text')}
          >
            <Type size={14} />
            <span>Style</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'bg' ? 'active' : ''}`}
            onClick={() => setActiveTab('bg')}
          >
            <Palette size={14} />
            <span>Theme</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'overlay' ? 'active' : ''}`}
            onClick={() => setActiveTab('overlay')}
          >
            <Eye size={14} />
            <span>FX</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'music' ? 'active' : ''}`}
            onClick={() => setActiveTab('music')}
          >
            <Music size={14} />
            <span>Music</span>
          </button>
        </div>

        {/* Tab 1: Scroll & Teleprompter Mode */}
        {activeTab === 'mode' && (
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">Teleprompter Animation Style</label>
              <select
                className="form-select"
                value={scrollMode}
                onChange={(e) => setScrollMode(e.target.value)}
              >
                <option value="kinetic-words">🔥 Viral Kinetic Words (Hormozi Pop)</option>
                <option value="smooth-scroll">📜 Smooth Vertical Teleprompter</option>
                <option value="line-focus">🔍 Line-by-Line Focus Highlight</option>
                <option value="news-ticker">⚡ News Ticker Bottom Banner</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Reading Speed (WPM)</span>
                <span className="form-label-val">{speedWpm} WPM</span>
              </label>
              <input
                type="range"
                className="range-slider"
                min="60"
                max="280"
                step="10"
                value={speedWpm}
                onChange={(e) => setSpeedWpm(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Text Vertical Alignment</label>
              <div className="aspect-pills">
                <button
                  className={`aspect-pill ${textPosition === 'top' ? 'active' : ''}`}
                  onClick={() => setTextPosition('top')}
                >
                  Top
                </button>
                <button
                  className={`aspect-pill ${textPosition === 'center' ? 'active' : ''}`}
                  onClick={() => setTextPosition('center')}
                >
                  Center
                </button>
                <button
                  className={`aspect-pill ${textPosition === 'bottom' ? 'active' : ''}`}
                  onClick={() => setTextPosition('bottom')}
                >
                  Bottom
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Focus Box Customization (NEW) */}
        {activeTab === 'box' && (
          <div className="space-y-4">
            <div className="card flex items-center justify-between">
              <div>
                <span className="text-xs font-bold block">Show Reading Focus Box</span>
                <span className="text-[10px] text-gray-400">Toggle center guide box outline</span>
              </div>
              <input
                type="checkbox"
                className="w-4 h-4 accent-indigo-500 cursor-pointer"
                checked={showReadingBox}
                onChange={(e) => setShowReadingBox(e.target.checked)}
              />
            </div>

            {showReadingBox && (
              <>
                <div className="form-group">
                  <label className="form-label">
                    <span>Box Height (Size Scale)</span>
                    <span className="form-label-val">{boxScale.toFixed(1)}x</span>
                  </label>
                  <input
                    type="range"
                    className="range-slider"
                    min="0.6"
                    max="2.5"
                    step="0.1"
                    value={boxScale}
                    onChange={(e) => setBoxScale(parseFloat(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span>Box Width</span>
                    <span className="form-label-val">{boxWidthPercent}%</span>
                  </label>
                  <input
                    type="range"
                    className="range-slider"
                    min="40"
                    max="96"
                    step="2"
                    value={boxWidthPercent}
                    onChange={(e) => setBoxWidthPercent(Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span>Corner Radius (Roundness)</span>
                    <span className="form-label-val">{boxBorderRadius}px</span>
                  </label>
                  <input
                    type="range"
                    className="range-slider"
                    min="0"
                    max="40"
                    step="2"
                    value={boxBorderRadius}
                    onChange={(e) => setBoxBorderRadius(Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span>Border Outline Thickness</span>
                    <span className="form-label-val">{boxBorderWidth}px</span>
                  </label>
                  <input
                    type="range"
                    className="range-slider"
                    min="0"
                    max="8"
                    step="1"
                    value={boxBorderWidth}
                    onChange={(e) => setBoxBorderWidth(Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Box Background Fill Color</label>
                  <div className="color-picker-row">
                    <input
                      type="color"
                      className="color-swatch-input"
                      value={activeLineBg.startsWith('#') ? activeLineBg : '#6366f1'}
                      onChange={(e) => setActiveLineBg(e.target.value)}
                    />
                    <input
                      type="text"
                      className="form-input text-xs font-mono"
                      value={activeLineBg}
                      onChange={(e) => setActiveLineBg(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 3: Typography & Colors */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">Font Family</label>
              <select
                className="form-select"
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
              >
                <option value="Bebas Neue">Bebas Neue (Bold Viral)</option>
                <option value="Inter">Inter (Clean Modern)</option>
                <option value="Montserrat">Montserrat (Strong Sans)</option>
                <option value="Oswald">Oswald (Tall & Punchy)</option>
                <option value="Space Grotesk">Space Grotesk (Tech)</option>
                <option value="Playfair Display">Playfair Display (Serif)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Font Size</span>
                <span className="form-label-val">{fontSize}px</span>
              </label>
              <input
                type="range"
                className="range-slider"
                min="24"
                max="72"
                step="2"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Main Text Color</label>
              <div className="color-picker-row">
                <input
                  type="color"
                  className="color-swatch-input"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                />
                <input
                  type="text"
                  className="form-input text-xs font-mono"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Active Word / Highlight Accent</label>
              <div className="color-picker-row">
                <input
                  type="color"
                  className="color-swatch-input"
                  value={highlightColor}
                  onChange={(e) => setHighlightColor(e.target.value)}
                />
                <input
                  type="text"
                  className="form-input text-xs font-mono"
                  value={highlightColor}
                  onChange={(e) => setHighlightColor(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Background & Themes */}
        {activeTab === 'bg' && (
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">Background Aesthetic</label>
              <select
                className="form-select"
                value={bgTheme}
                onChange={(e) => setBgTheme(e.target.value)}
              >
                <option value="animated-gradient">🌈 Animated Mesh Gradient</option>
                <option value="cyberpunk-grid">⚡ Cyberpunk Neon Grid</option>
                <option value="dark-glass">💎 Dark Glassmorphic Midnight</option>
                <option value="warm-sunset">🌅 Warm Sunset Magenta</option>
                <option value="emerald-gold">✨ Emerald Gold Luxury</option>
                <option value="solid-color">🎨 Solid Color Backdrop</option>
              </select>
            </div>

            {bgTheme === 'solid-color' && (
              <div className="form-group">
                <label className="form-label">Solid Background Color</label>
                <div className="color-picker-row">
                  <input
                    type="color"
                    className="color-swatch-input"
                    value={solidBgColor}
                    onChange={(e) => setSolidBgColor(e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-input text-xs font-mono"
                    value={solidBgColor}
                    onChange={(e) => setSolidBgColor(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Overlays & FX */}
        {activeTab === 'overlay' && (
          <div className="space-y-4">
            <div className="card flex items-center justify-between">
              <span className="text-xs font-semibold">Reading Progress Bar</span>
              <input
                type="checkbox"
                className="w-4 h-4 accent-indigo-500 cursor-pointer"
                checked={showProgressBar}
                onChange={(e) => setShowProgressBar(e.target.checked)}
              />
            </div>

            <div className="card flex items-center justify-between">
              <span className="text-xs font-semibold">Audio Spectrum Waveform</span>
              <input
                type="checkbox"
                className="w-4 h-4 accent-indigo-500 cursor-pointer"
                checked={showAudioVisualizer}
                onChange={(e) => setShowAudioVisualizer(e.target.checked)}
              />
            </div>

            <div className="card space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Creator Tag / Watermark</span>
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-indigo-500 cursor-pointer"
                  checked={showWatermark}
                  onChange={(e) => setShowWatermark(e.target.checked)}
                />
              </div>
              {showWatermark && (
                <input
                  type="text"
                  className="form-input text-xs"
                  placeholder="@yourhandle"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                />
              )}
            </div>
          </div>
        )}

        {/* Tab 6: Background Music */}
        {activeTab === 'music' && (
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold">
                  <Disc size={14} className="text-indigo-400" />
                  <span>20 Royalty-Free Presets</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-medium">100% Free & Offline</span>
              </label>
              <select
                className="form-select text-xs"
                value={bgmTrackId}
                onChange={(e) => handleSelectTrack(e.target.value)}
              >
                {BGM_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name} ({preset.genre})
                  </option>
                ))}
                <option value="custom">📁 Custom Music Upload...</option>
              </select>
            </div>

            {/* Live Audition / Listen Button */}
            {bgmTrackId !== 'none' && (
              <button
                type="button"
                className={`btn w-full flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                  isPreviewingBgm
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 animate-pulse'
                    : 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30'
                }`}
                onClick={() => handleTogglePreview()}
              >
                {isPreviewingBgm ? (
                  <>
                    <Square size={14} className="fill-current" />
                    <span>⏹ Stop Audio Preview</span>
                  </>
                ) : (
                  <>
                    <Play size={14} className="fill-current" />
                    <span>▶ Preview Music Track</span>
                  </>
                )}
              </button>
            )}

            {bgmTrackId === 'custom' && (
              <div className="card space-y-2">
                <label className="text-xs font-semibold block">Upload Music File (.mp3/.wav)</label>
                <input
                  type="file"
                  accept="audio/*"
                  className="form-input text-xs"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setCustomBgmFile(e.target.files[0]);
                      if (isPreviewingBgm) {
                        speechManager.playBgm(e.target.files[0], bgmVolume, 'custom');
                      }
                    }
                  }}
                />
                {customBgmFile && (
                  <p className="text-[11px] text-emerald-400 font-mono truncate">
                    🎵 Selected: {customBgmFile.name}
                  </p>
                )}
              </div>
            )}

            <div className="card space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold flex items-center gap-1.5">
                  <Volume2 size={14} className="text-amber-400" />
                  <span>Music Volume</span>
                </span>
                <span className="text-xs font-bold text-amber-400 font-mono">
                  {Math.round(bgmVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                className="range-slider w-full"
                min="0"
                max="0.80"
                step="0.02"
                value={bgmVolume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              />
              <p className="text-[10px] text-gray-400 italic">
                💡 Recommended: 15% - 25% keeps background music subtle so speech stays clear.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
