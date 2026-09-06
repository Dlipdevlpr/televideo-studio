import React, { useState, useEffect } from 'react';
import { Sliders, Type, Palette, Eye, Layout, Square, Music, Volume2, Upload, Disc, Play, Pause, Save, Trash2, Bookmark } from 'lucide-react';
import { BGM_PRESETS } from '../utils/bgmData';
import { saveCustomBgm, getCustomBgms, deleteCustomBgm, saveCustomBgImage, getCustomBgImages, deleteCustomBgImage } from '../utils/storageDB';
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
  enableHighlight = true,
  setEnableHighlight,
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
  setCustomBgmFile,
  customBgImageFile,
  setCustomBgImageFile
}) {
  const [activeTab, setActiveTab] = useState('mode');
  const [isPreviewingBgm, setIsPreviewingBgm] = useState(false);
  const [presets, setPresets] = useState({});
  const [presetName, setPresetName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [savedBgms, setSavedBgms] = useState([]);
  const [savedBgImages, setSavedBgImages] = useState([]);

  useEffect(() => {
    // Load presets from localStorage
    const saved = localStorage.getItem('televideo_presets');
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse presets', e);
      }
    }

    // Load custom BGMs from IndexedDB
    getCustomBgms().then(bgms => {
      setSavedBgms(bgms || []);
    }).catch(e => console.error(e));

    // Load custom BgImages from IndexedDB
    getCustomBgImages().then(imgs => {
      const processed = (imgs || []).map(img => ({ ...img, url: URL.createObjectURL(img.blob) }));
      setSavedBgImages(processed);
    }).catch(e => console.error(e));
  }, []);

  const savePreset = () => {
    if (!presetName.trim()) return;
    const newPresets = {
      ...presets,
      [presetName.trim()]: {
        scrollMode, fontFamily, fontSize, textColor, highlightColor, enableHighlight,
        activeLineBg, bgTheme, solidBgColor, textPosition, speedWpm,
        showProgressBar, showAudioVisualizer, watermarkText, showWatermark,
        showReadingBox, boxScale, boxWidthPercent, boxBorderRadius, boxBorderWidth,
        bgmTrackId, bgmVolume
      }
    };
    setPresets(newPresets);
    localStorage.setItem('televideo_presets', JSON.stringify(newPresets));
    setSelectedPreset(presetName.trim());
    setPresetName('');
  };

  const loadPreset = (name) => {
    const p = presets[name];
    if (!p) return;
    setSelectedPreset(name);
    
    if (p.scrollMode !== undefined) setScrollMode(p.scrollMode);
    if (p.fontFamily !== undefined) setFontFamily(p.fontFamily);
    if (p.fontSize !== undefined) setFontSize(p.fontSize);
    if (p.textColor !== undefined) setTextColor(p.textColor);
    if (p.highlightColor !== undefined) setHighlightColor(p.highlightColor);
    if (p.enableHighlight !== undefined && setEnableHighlight) setEnableHighlight(p.enableHighlight);
    if (p.activeLineBg !== undefined) setActiveLineBg(p.activeLineBg);
    if (p.bgTheme !== undefined) setBgTheme(p.bgTheme);
    if (p.solidBgColor !== undefined) setSolidBgColor(p.solidBgColor);
    if (p.textPosition !== undefined) setTextPosition(p.textPosition);
    if (p.speedWpm !== undefined) setSpeedWpm(p.speedWpm);
    if (p.showProgressBar !== undefined) setShowProgressBar(p.showProgressBar);
    if (p.showAudioVisualizer !== undefined) setShowAudioVisualizer(p.showAudioVisualizer);
    if (p.watermarkText !== undefined) setWatermarkText(p.watermarkText);
    if (p.showWatermark !== undefined) setShowWatermark(p.showWatermark);
    if (p.showReadingBox !== undefined) setShowReadingBox(p.showReadingBox);
    if (p.boxScale !== undefined) setBoxScale(p.boxScale);
    if (p.boxWidthPercent !== undefined) setBoxWidthPercent(p.boxWidthPercent);
    if (p.boxBorderRadius !== undefined) setBoxBorderRadius(p.boxBorderRadius);
    if (p.boxBorderWidth !== undefined) setBoxBorderWidth(p.boxBorderWidth);
    if (p.bgmTrackId !== undefined) {
      setBgmTrackId(p.bgmTrackId);
      if (isPreviewingBgm) {
         speechManager.stopBgm();
         setIsPreviewingBgm(false);
      }
    }
    if (p.bgmVolume !== undefined) {
      setBgmVolume(p.bgmVolume);
      speechManager.setBgmVolume(p.bgmVolume);
    }
  };

  const deletePreset = (name) => {
    const newPresets = { ...presets };
    delete newPresets[name];
    setPresets(newPresets);
    localStorage.setItem('televideo_presets', JSON.stringify(newPresets));
    if (selectedPreset === name) setSelectedPreset('');
  };

  const handleTogglePreview = async (trackId, blob = null) => {
    if (isPreviewingBgm === trackId) {
      speechManager.stopBgm();
      setIsPreviewingBgm(false);
    } else {
      if (trackId === 'none') return;
      speechManager.stopBgm();
      const src = trackId.startsWith('custom') ? blob : null;
      await speechManager.playBgm(src, bgmVolume, trackId);
      setIsPreviewingBgm(trackId);
    }
  };

  const handleSelectTrack = async (newTrackId, blob = null) => {
    setBgmTrackId(newTrackId);
    if (isPreviewingBgm) {
      if (newTrackId === 'none') {
        speechManager.stopBgm();
        setIsPreviewingBgm(false);
      } else {
        const src = newTrackId.startsWith('custom') ? blob : null;
        await speechManager.playBgm(src, bgmVolume, newTrackId);
        setIsPreviewingBgm(newTrackId);
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
        {/* Presets Management Section */}
        <div id="style-section" className="card mb-4 bg-gray-800/40 border border-gray-700/50">
          <div className="flex items-center gap-2 mb-3 text-indigo-300">
            <Bookmark size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">Style Presets</span>
          </div>
          
          <div className="space-y-3">
            {Object.keys(presets).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.keys(presets).map(p => (
                  <button
                    key={p}
                    onClick={() => loadPreset(p)}
                    className={`group relative px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all border ${
                      selectedPreset === p 
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-[0_0_10px_rgba(139,92,246,0.2)]' 
                        : 'bg-[#1e2229] border-gray-700/50 text-gray-400 hover:border-gray-500 hover:text-gray-200 hover:bg-[#262b33]'
                    }`}
                  >
                    {p}
                    {selectedPreset === p && (
                      <span 
                        className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                        onClick={(e) => { e.stopPropagation(); deletePreset(p); }}
                        title="Delete Preset"
                      >
                        ×
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                placeholder="Name current settings..." 
                className="form-input text-xs flex-1"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    savePreset();
                  }
                }}
              />
              <button 
                onClick={savePreset}
                disabled={!presetName.trim()}
                className={`p-2 flex items-center justify-center rounded transition-colors ${
                  presetName.trim() 
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-lg shadow-indigo-500/20' 
                    : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                }`}
                title="Save Current Settings as Preset"
              >
                <Save size={14} />
              </button>
            </div>
          </div>
        </div>

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
              <div className="flex items-center justify-between mb-1.5">
                <label className="form-label mb-0">Active Word / Highlight Accent</label>
                <div 
                  className="flex items-center gap-1.5 cursor-pointer select-none" 
                  onClick={() => setEnableHighlight(!enableHighlight)}
                >
                  <span className={`text-[10px] font-bold tracking-wider ${enableHighlight ? 'text-indigo-400' : 'text-gray-500'}`}>
                    {enableHighlight ? 'ON' : 'OFF'}
                  </span>
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-indigo-500 cursor-pointer"
                    checked={enableHighlight}
                    onChange={(e) => setEnableHighlight(e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              {enableHighlight ? (
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
              ) : (
                <p className="text-[11px] text-gray-500 italic mt-1">
                  Highlighting disabled — text displays in Main Text Color.
                </p>
              )}
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
                <option value="custom-image">🖼️ Custom Image</option>
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

            {bgTheme === 'custom-image' && (
              <div className="form-group">
                <label className="form-label">Custom Image</label>
                
                {/* Saved Background Images */}
                {savedBgImages.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x mb-2">
                    {savedBgImages.map(img => {
                      const isSelected = customBgImageFile?.name === img.name;
                      const imgUrl = img.url || URL.createObjectURL(img.blob); // fallback just in case
                      return (
                        <div key={img.id} className="relative group flex-shrink-0 snap-start">
                          <img 
                            src={imgUrl} 
                            alt={img.name} 
                            className={`w-16 h-16 object-cover rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-indigo-500 shadow-md' : 'border-gray-700 hover:border-gray-500'}`}
                            onClick={() => setCustomBgImageFile(img.blob)}
                          />
                          <button
                            className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-rose-500 text-white opacity-0 group-hover:opacity-100 transition-opacity z-30"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await deleteCustomBgImage(img.id);
                              const imgs = await getCustomBgImages();
                              setSavedBgImages(imgs.map(i => ({ ...i, url: URL.createObjectURL(i.blob) })));
                              if (isSelected) setCustomBgImageFile(null);
                            }}
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
                
                <input
                  type="file"
                  accept="image/*"
                  className="form-input text-xs"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const newId = 'bg-' + Date.now();
                      
                      try {
                        await saveCustomBgImage(newId, file.name, file);
                        const imgs = await getCustomBgImages();
                        setSavedBgImages(imgs.map(i => ({ ...i, url: URL.createObjectURL(i.blob) })));
                        setCustomBgImageFile(file);
                      } catch (err) {
                        console.error('Failed to save background image:', err);
                        alert('Could not save file to browser storage. It might be too large.');
                      }
                    }
                  }}
                />
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
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
                
                {/* 1. None Button */}
                <button
                  onClick={() => handleSelectTrack('none')}
                  className={`snap-start flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center gap-1 p-1 transition-all relative overflow-hidden border ${
                    bgmTrackId === 'none' || !bgmTrackId
                      ? 'border-rose-500 bg-rose-500/10 text-rose-400'
                      : 'border-gray-700 hover:border-gray-500 text-gray-400'
                  }`}
                >
                  <Volume2 size={16} className={bgmTrackId === 'none' ? 'text-rose-400' : 'text-gray-400'} />
                  <span className="text-[9px] font-bold text-center">None</span>
                </button>

                {/* 2. Custom Upload Placeholder */}
                <button
                  onClick={() => handleSelectTrack('custom')}
                  className={`snap-start flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center gap-1 p-1 transition-all relative overflow-hidden border-2 border-dashed ${
                    bgmTrackId === 'custom'
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-gray-600 hover:border-gray-400 bg-gray-800/30'
                  }`}
                >
                  <Upload size={16} className={bgmTrackId === 'custom' ? 'text-indigo-400' : 'text-gray-400'} />
                  <span className="text-[9px] font-bold text-center leading-tight">Upload<br/>New</span>
                </button>

                {/* 3. Saved Custom BGMs */}
                {savedBgms.map((bgm) => {
                  const isSelected = bgmTrackId === bgm.id;
                  return (
                    <button
                      key={bgm.id}
                      onClick={() => handleSelectTrack(bgm.id, bgm.blob)}
                      className={`snap-start flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center gap-1 p-1 transition-all relative overflow-hidden group ${
                        isSelected 
                          ? 'border-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                          : 'border border-gray-700/50 hover:border-gray-500'
                      }`}
                    >
                      <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity bg-gradient-to-br from-emerald-600 to-teal-800" />
                      <Music size={16} className={isSelected ? 'text-emerald-400 animate-spin-slow' : 'text-gray-400'} />
                      <span className="text-[9px] font-bold text-center leading-tight z-10 truncate w-full px-1" title={bgm.name}>{bgm.name}</span>
                      <span className="text-[7px] text-emerald-400 uppercase tracking-wider z-10">Saved</span>
                      
                      {/* Play/Pause Preview Button (Centered) */}
                      <button
                        className={`absolute inset-0 m-auto w-8 h-8 flex items-center justify-center rounded-full bg-emerald-500/90 text-white transition-all z-20 hover:bg-emerald-400 hover:scale-110 shadow-lg ${
                          isPreviewingBgm === bgm.id ? 'opacity-100 scale-100' : 'opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100'
                        }`}
                        onClick={(e) => { e.stopPropagation(); handleTogglePreview(bgm.id, bgm.blob); }}
                        title={isPreviewingBgm === bgm.id ? "Stop Preview" : "Play Preview"}
                      >
                        {isPreviewingBgm === bgm.id ? <Pause fill="white" size={14} /> : <Play fill="white" size={14} className="ml-0.5" />}
                      </button>

                      {/* Delete Button */}
                      <span 
                        className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-rose-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity z-30 hover:bg-rose-500 cursor-pointer"
                        title="Delete saved track"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (isPreviewingBgm === bgm.id) {
                            speechManager.stopBgm();
                            setIsPreviewingBgm(false);
                          }
                          await deleteCustomBgm(bgm.id);
                          const newSaved = await getCustomBgms();
                          setSavedBgms(newSaved);
                          if (bgmTrackId === bgm.id) handleSelectTrack('none');
                        }}
                      >
                        <Trash2 size={9} />
                      </span>
                    </button>
                  );
                })}

                {/* 4. Royalty Free Presets */}
                {BGM_PRESETS.map((preset) => {
                  if (preset.id === 'none') return null;
                  const isSelected = bgmTrackId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectTrack(preset.id)}
                      className={`snap-start flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center gap-1 p-1 transition-all relative overflow-hidden group ${
                        isSelected 
                          ? 'border-2 border-indigo-500 shadow-[0_0_15px_rgba(139,92,246,0.3)]' 
                          : 'border border-gray-700/50 hover:border-gray-500'
                      }`}
                    >
                      <div className={`absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity bg-gradient-to-br ${
                        preset.id.length % 3 === 0 ? 'from-purple-600 to-blue-600' :
                        preset.id.length % 2 === 0 ? 'from-emerald-500 to-teal-700' :
                        'from-rose-500 to-orange-500'
                      }`} />
                      
                      <Disc size={16} className={isSelected ? 'text-indigo-400 animate-spin-slow' : 'text-gray-400'} />
                      <span className="text-[9px] font-bold text-center leading-tight z-10">{preset.name}</span>
                      <span className="text-[7px] text-gray-400 uppercase tracking-wider z-10">{preset.genre.split('/')[0]}</span>

                      {/* Play/Pause Preview Button (Centered) */}
                      <button
                        className={`absolute inset-0 m-auto w-8 h-8 flex items-center justify-center rounded-full bg-indigo-500/90 text-white transition-all z-20 hover:bg-indigo-400 hover:scale-110 shadow-lg ${
                          isPreviewingBgm === preset.id ? 'opacity-100 scale-100' : 'opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100'
                        }`}
                        onClick={(e) => { e.stopPropagation(); handleTogglePreview(preset.id); }}
                        title={isPreviewingBgm === preset.id ? "Stop Preview" : "Play Preview"}
                      >
                        {isPreviewingBgm === preset.id ? <Pause fill="white" size={14} /> : <Play fill="white" size={14} className="ml-0.5" />}
                      </button>
                    </button>
                  );
                })}
              </div>
            </div>

            {bgmTrackId === 'custom' && (
              <div className="card space-y-2">
                <label className="text-xs font-semibold block">Upload Music File (.mp3/.wav)</label>
                <input
                  type="file"
                  accept="audio/*"
                  className="form-input text-xs"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const newId = 'custom-' + Date.now();
                      
                      try {
                        // Save to IndexedDB
                        await saveCustomBgm(newId, file.name, file);
                        const newSaved = await getCustomBgms();
                        setSavedBgms(newSaved);
                        
                        // Select it immediately
                        setBgmTrackId(newId);
                        setCustomBgmFile(file);
                        if (isPreviewingBgm) {
                          speechManager.playBgm(file, bgmVolume, 'custom');
                        }
                      } catch (err) {
                        console.error('Failed to save custom BGM:', err);
                        alert('Could not save file to browser storage. It might be too large.');
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
