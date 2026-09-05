import React, { useState } from 'react';
import { FileText, PlaySquare, Sliders } from 'lucide-react';
import Navbar from './components/Navbar';
import ScriptEditor from './components/ScriptEditor';
import CustomizerPanel from './components/CustomizerPanel';
import VideoCanvasPreview from './components/VideoCanvasPreview';
import PresetsModal from './components/PresetsModal';
import { speechManager } from './utils/speechManager';

export default function App() {
  // Script State
  const [scriptText, setScriptText] = useState(
    `A Normal Day in My Life\n\nYou know, sometimes I think my days are actually quite simple.\nAfter breakfast, I think about what I need to accomplish.\nI usually have a few things in my mind, but I don't always finish everything I planned.`
  );

  // Aspect Ratio & Layout State
  const [aspectRatio, setAspectRatio] = useState('9:16'); // '9:16' | '16:9' | '1:1'
  const [mobileTab, setMobileTab] = useState('preview'); // 'script' | 'preview' | 'style'
  
  // Teleprompter & Styling State
  const [activePresetId, setActivePresetId] = useState('smooth-teleprompter');
  const [scrollMode, setScrollMode] = useState('smooth-scroll');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [fontSize, setFontSize] = useState(36);
  const [textColor, setTextColor] = useState('#ffffff');
  const [highlightColor, setHighlightColor] = useState('#6366f1');
  const [activeLineBg, setActiveLineBg] = useState('rgba(99, 102, 241, 0.25)');
  const [boxOpacity, setBoxOpacity] = useState(0.6);
  const [bgTheme, setBgTheme] = useState('animated-gradient');
  const [solidBgColor, setSolidBgColor] = useState('#090b10');
  const [textPosition, setTextPosition] = useState('center');
  const [speedWpm, setSpeedWpm] = useState(140);

  // Reading Focus Box Controls
  const [showReadingBox, setShowReadingBox] = useState(true);
  const [boxScale, setBoxScale] = useState(1.0);
  const [boxWidthPercent, setBoxWidthPercent] = useState(90);
  const [boxBorderRadius, setBoxBorderRadius] = useState(16);
  const [boxBorderWidth, setBoxBorderWidth] = useState(2);

  // FX Overlays
  const [showProgressBar, setShowProgressBar] = useState(true);
  const [showAudioVisualizer, setShowAudioVisualizer] = useState(true);
  const [watermarkText, setWatermarkText] = useState('@ReadLoudAndClear');
  const [showWatermark, setShowWatermark] = useState(true);

  // Audio State
  const [audioMode, setAudioMode] = useState('tts'); // 'tts' | 'mic' | 'upload'
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [customAudioFile, setCustomAudioFile] = useState(null);

  // Background Music (BGM) State
  const [bgmTrackId, setBgmTrackId] = useState('lofi-beats');
  const [bgmVolume, setBgmVolume] = useState(0.20);
  const [customBgmFile, setCustomBgmFile] = useState(null);

  // TTS Selective Line Scope State
  const [ttsRangeMode, setTtsRangeMode] = useState('first-line'); // 'first-line' | 'first-two' | 'custom' | 'full'
  const [selectedTtsLines, setSelectedTtsLines] = useState(new Set([0])); // Default Line 1 checked

  // Modals & Export State
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Handle Preset selection
  const handleSelectPreset = (preset) => {
    setActivePresetId(preset.id);
    const cfg = preset.config;
    if (cfg.scrollMode) setScrollMode(cfg.scrollMode);
    if (cfg.fontFamily) setFontFamily(cfg.fontFamily);
    if (cfg.fontSize) setFontSize(cfg.fontSize);
    if (cfg.textColor) setTextColor(cfg.textColor);
    if (cfg.highlightColor) setHighlightColor(cfg.highlightColor);
    if (cfg.activeLineBg) setActiveLineBg(cfg.activeLineBg);
    if (cfg.bgTheme) setBgTheme(cfg.bgTheme);
    if (cfg.solidBgColor) setSolidBgColor(cfg.solidBgColor);
    if (cfg.textPosition) setTextPosition(cfg.textPosition);
    if (cfg.speedWpm) setSpeedWpm(cfg.speedWpm);
  };

  // Mic Recording Handlers
  const handleStartMicRecording = async () => {
    try {
      await speechManager.startMicRecording();
      setIsRecordingAudio(true);
    } catch (err) {
      alert('Could not access microphone: ' + err.message);
    }
  };

  const handleStopMicRecording = async () => {
    const blob = await speechManager.stopMicRecording();
    setIsRecordingAudio(false);
    if (blob) {
      const file = new File([blob], 'mic_recording.webm', { type: 'audio/webm' });
      setCustomAudioFile(file);
      setAudioMode('upload');
    }
  };

  return (
    <div className="app-container">
      {/* Navbar */}
      <Navbar
        onOpenPresets={() => setIsPresetsOpen(true)}
        onExport={() => {
          const exportBtn = document.querySelector('.seek-slider')?.parentElement?.nextElementSibling;
          if (exportBtn) exportBtn.click();
        }}
        isExporting={isExporting}
        isRecording={isRecordingAudio}
        aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
      />

      {/* Main Workspace Layout */}
      <main className="main-workspace">
        {/* Left Panel: Script & Audio Editor */}
        <div className={`panel-wrapper panel-wrapper-script ${mobileTab === 'script' ? 'mobile-active' : ''}`}>
          <ScriptEditor
            scriptText={scriptText}
            setScriptText={setScriptText}
            audioMode={audioMode}
            setAudioMode={setAudioMode}
            selectedVoiceIndex={selectedVoiceIndex}
            setSelectedVoiceIndex={setSelectedVoiceIndex}
            speechRate={speechRate}
            setSpeechRate={setSpeechRate}
            onStartMicRecording={handleStartMicRecording}
            onStopMicRecording={handleStopMicRecording}
            isRecordingAudio={isRecordingAudio}
            customAudioFile={customAudioFile}
            setCustomAudioFile={setCustomAudioFile}
            ttsRangeMode={ttsRangeMode}
            setTtsRangeMode={setTtsRangeMode}
            selectedTtsLines={selectedTtsLines}
            setSelectedTtsLines={setSelectedTtsLines}
          />
        </div>

        {/* Center Panel: Live Video Canvas Stage */}
        <div className={`panel-wrapper panel-wrapper-preview ${mobileTab === 'preview' ? 'mobile-active' : ''}`}>
          <VideoCanvasPreview
            scriptText={scriptText}
            scrollMode={scrollMode}
            fontFamily={fontFamily}
            fontSize={fontSize}
            textColor={textColor}
            highlightColor={highlightColor}
            activeLineBg={activeLineBg}
            boxOpacity={boxOpacity}
            bgTheme={bgTheme}
            solidBgColor={solidBgColor}
            textPosition={textPosition}
            speedWpm={speedWpm}
            showProgressBar={showProgressBar}
            showAudioVisualizer={showAudioVisualizer}
            watermarkText={watermarkText}
            showWatermark={showWatermark}
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            audioMode={audioMode}
            selectedVoiceIndex={selectedVoiceIndex}
            speechRate={speechRate}
            customAudioFile={customAudioFile}
            bgmTrackId={bgmTrackId}
            bgmVolume={bgmVolume}
            customBgmFile={customBgmFile}
            isExporting={isExporting}
            setIsExporting={setIsExporting}
            showReadingBox={showReadingBox}
            boxScale={boxScale}
            boxWidthPercent={boxWidthPercent}
            boxBorderRadius={boxBorderRadius}
            boxBorderWidth={boxBorderWidth}
            ttsRangeMode={ttsRangeMode}
            selectedTtsLines={selectedTtsLines}
          />
        </div>

        {/* Right Panel: Teleprompter Customizer */}
        <div className={`panel-wrapper panel-wrapper-style ${mobileTab === 'style' ? 'mobile-active' : ''}`}>
          <CustomizerPanel
            scrollMode={scrollMode}
            setScrollMode={setScrollMode}
            fontFamily={fontFamily}
            setFontFamily={setFontFamily}
            fontSize={fontSize}
            setFontSize={setFontSize}
            textColor={textColor}
            setTextColor={setTextColor}
            highlightColor={highlightColor}
            setHighlightColor={setHighlightColor}
            activeLineBg={activeLineBg}
            setActiveLineBg={setActiveLineBg}
            bgTheme={bgTheme}
            setBgTheme={setBgTheme}
            solidBgColor={solidBgColor}
            setSolidBgColor={setSolidBgColor}
            textPosition={textPosition}
            setTextPosition={setTextPosition}
            speedWpm={speedWpm}
            setSpeedWpm={setSpeedWpm}
            showProgressBar={showProgressBar}
            setShowProgressBar={setShowProgressBar}
            showAudioVisualizer={showAudioVisualizer}
            setShowAudioVisualizer={setShowAudioVisualizer}
            watermarkText={watermarkText}
            setWatermarkText={setWatermarkText}
            showWatermark={showWatermark}
            setShowWatermark={setShowWatermark}
            showReadingBox={showReadingBox}
            setShowReadingBox={setShowReadingBox}
            boxScale={boxScale}
            setBoxScale={setBoxScale}
            boxWidthPercent={boxWidthPercent}
            setBoxWidthPercent={setBoxWidthPercent}
            boxBorderRadius={boxBorderRadius}
            setBoxBorderRadius={setBoxBorderRadius}
            boxBorderWidth={boxBorderWidth}
            setBoxBorderWidth={setBoxBorderWidth}
            bgmTrackId={bgmTrackId}
            setBgmTrackId={setBgmTrackId}
            bgmVolume={bgmVolume}
            setBgmVolume={setBgmVolume}
            customBgmFile={customBgmFile}
            setCustomBgmFile={setCustomBgmFile}
          />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <button
          className={`mobile-nav-btn ${mobileTab === 'script' ? 'active' : ''}`}
          onClick={() => setMobileTab('script')}
        >
          <FileText size={20} />
          <span>Script</span>
        </button>

        <button
          className={`mobile-nav-btn ${mobileTab === 'preview' ? 'active' : ''}`}
          onClick={() => setMobileTab('preview')}
        >
          <PlaySquare size={20} />
          <span>Studio</span>
        </button>

        <button
          className={`mobile-nav-btn ${mobileTab === 'style' ? 'active' : ''}`}
          onClick={() => setMobileTab('style')}
        >
          <Sliders size={20} />
          <span>Style</span>
        </button>
      </nav>

      {/* Presets Modal */}
      <PresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onSelectPreset={handleSelectPreset}
        activePresetId={activePresetId}
      />
    </div>
  );
}
