import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Download, Radio, Volume2, Share2, X, Film } from 'lucide-react';
import confetti from 'canvas-confetti';
import { renderTeleprompterCanvas } from '../utils/teleprompterEngine';
import { speechManager } from '../utils/speechManager';
import { VideoExporter } from '../utils/videoRecorder';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export default function VideoCanvasPreview({
  scriptText,
  scrollMode,
  fontFamily,
  fontSize,
  textColor,
  highlightColor,
  activeLineBg,
  boxOpacity,
  bgTheme,
  solidBgColor,
  textPosition,
  speedWpm,
  showProgressBar,
  showAudioVisualizer,
  watermarkText,
  showWatermark,
  aspectRatio,
  setAspectRatio,
  audioMode,
  selectedVoiceIndex,
  speechRate,
  customAudioFile,
  isExporting,
  setIsExporting,

  // Reading Box Controls
  showReadingBox,
  boxScale,
  boxWidthPercent,
  boxBorderRadius,
  boxBorderWidth,

  // TTS Line Selection Props
  ttsRangeMode,
  selectedTtsLines
}) {
  const canvasRef = useRef(null);
  
  // ── React state (for UI display only) ────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(15);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [exportPercent, setExportPercent] = useState(0);
  const [lastExportResult, setLastExportResult] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);

  // ── Animation refs (the REAL source of truth for the render loop) ─
  const animFrameIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const videoExporterRef = useRef(null);
  const progressRef = useRef(0);
  const currentTimeRef = useRef(0);
  const totalDurationRef = useRef(15);
  const isPlayingRef = useRef(false);
  const isRecordingRef = useRef(false);
  const lastUiUpdateRef = useRef(0);

  // Direct DOM refs for high-performance UI updates (bypasses React)
  const timeDisplayRef = useRef(null);
  const progressBarRef = useRef(null);

  // This ref holds ALL canvas drawing config. Updated synchronously on
  // every render (cheap pointer swap), but the animation loop reads it
  // without any useEffect dependency — so the loop NEVER restarts.
  const renderConfigRef = useRef({});

  // Keep isPlayingRef in sync
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Calculate total reading duration based on word count & WPM
  useEffect(() => {
    const words = scriptText.trim().split(/\s+/).filter(w => w.length > 0).length;
    const durationSeconds = Math.max(5, Math.ceil((words / speedWpm) * 60));
    setTotalDuration(durationSeconds);
    totalDurationRef.current = durationSeconds;
  }, [scriptText, speedWpm]);

  // Canvas pixel dimensions
  const getCanvasDimensions = () => {
    if (aspectRatio === '16:9') return { width: 1280, height: 720 };
    if (aspectRatio === '1:1') return { width: 1080, height: 1080 };
    return { width: 720, height: 1280 };
  };
  const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions();

  // Sync render config ref on every React render (no useEffect needed —
  // this runs during the render phase itself, before paint).
  renderConfigRef.current = {
    canvasWidth, canvasHeight, scriptText, aspectRatio, scrollMode,
    fontFamily, fontSize, textColor, highlightColor, activeLineBg,
    boxOpacity, textPosition, bgTheme, solidBgColor, showProgressBar,
    showAudioVisualizer, watermarkText, showWatermark, showReadingBox,
    boxScale, boxWidthPercent, boxBorderRadius, boxBorderWidth
  };

  // TTS text helper
  const getTtsTextToSpeak = () => {
    const lines = scriptText.split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) return '';
    if (ttsRangeMode === 'first-line') return lines[0] || '';
    if (ttsRangeMode === 'first-two') return lines.slice(0, 2).join('. ');
    if (ttsRangeMode === 'custom') {
      const sel = lines.filter((_, i) => selectedTtsLines.has(i)).join('. ');
      return sel || lines[0] || '';
    }
    return scriptText;
  };

  // ═══════════════════════════════════════════════════════════════════
  // STABLE 60 FPS RENDER LOOP — runs once on mount, never restarts.
  // ALL dynamic values are read from refs so React re-renders (state
  // changes, prop changes) cannot interrupt the requestAnimationFrame
  // chain. This guarantees the canvas keeps drawing smooth frames even
  // while MediaRecorder is capturing for video export.
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let rafId;

    const tick = () => {
      const currentNow = performance.now();
      
      // 1. Advance playback time
      if (isPlayingRef.current) {
        if (!startTimeRef.current) {
          startTimeRef.current = currentNow - currentTimeRef.current * 1000;
        }
        const elapsed = (currentNow - startTimeRef.current) / 1000;
        currentTimeRef.current = elapsed;

        const dur = totalDurationRef.current || 15;
        const prog = Math.min(1, elapsed / dur);
        progressRef.current = prog;

        // Direct DOM updates bypass React's virtual DOM entirely.
        // This is extremely fast (sub-millisecond) and keeps the DOM active so
        // Android WebView doesn't aggressively throttle requestAnimationFrame.
        if (currentNow - lastUiUpdateRef.current > 33 || prog >= 1) { // ~30 FPS UI updates
          lastUiUpdateRef.current = currentNow;
          if (timeDisplayRef.current) timeDisplayRef.current.innerText = formatTime(elapsed);
          if (progressBarRef.current) progressBarRef.current.value = prog;
          
          // Only sync React state if we are NOT recording, to prevent full re-renders
          if (!isRecordingRef.current) {
            setCurrentTime(elapsed);
            setProgress(prog);
          }
        }

        if (prog >= 1) {
          isPlayingRef.current = false;
          setIsPlaying(false);
          speechManager.stop();
        }
      }

      // 2. Paint the canvas using latest config
      const c = renderConfigRef.current;
      if (c.canvasWidth) {
        // Resize canvas if aspect ratio changed
        if (canvas.width !== c.canvasWidth) canvas.width = c.canvasWidth;
        if (canvas.height !== c.canvasHeight) canvas.height = c.canvasHeight;

        renderTeleprompterCanvas(ctx, {
          width: c.canvasWidth,
          height: c.canvasHeight,
          scriptText: c.scriptText,
          progress: progressRef.current,
          currentTime: currentTimeRef.current,
          aspectRatio: c.aspectRatio,
          scrollMode: c.scrollMode,
          fontFamily: c.fontFamily,
          fontSize: c.fontSize,
          textColor: c.textColor,
          highlightColor: c.highlightColor,
          activeLineBg: c.activeLineBg,
          boxOpacity: c.boxOpacity,
          textPosition: c.textPosition,
          bgTheme: c.bgTheme,
          solidBgColor: c.solidBgColor,
          showProgressBar: c.showProgressBar,
          showAudioVisualizer: c.showAudioVisualizer,
          watermarkText: c.watermarkText,
          showWatermark: c.showWatermark,
          showReadingBox: c.showReadingBox,
          boxScale: c.boxScale,
          boxWidthPercent: c.boxWidthPercent,
          boxBorderRadius: c.boxBorderRadius,
          boxBorderWidth: c.boxBorderWidth
        });
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []); // ← empty deps: mount once, never restart

  // ── Playback Controls ────────────────────────────────────────────
  const togglePlay = () => {
    if (isPlayingRef.current) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      speechManager.pause();
    } else {
      if (progressRef.current >= 1) {
        progressRef.current = 0;
        currentTimeRef.current = 0;
        setProgress(0);
        setCurrentTime(0);
        startTimeRef.current = null;
      }
      startTimeRef.current = performance.now() - currentTimeRef.current * 1000;
      isPlayingRef.current = true;
      setIsPlaying(true);

      if (audioMode === 'tts') {
        const text = getTtsTextToSpeak();
        if (text) {
          speechManager.speak(text, {
            voiceIndex: selectedVoiceIndex,
            rate: speechRate
          });
        }
      } else if (audioMode === 'upload' && customAudioFile) {
        speechManager.ensureAudioContext().then(async () => {
          if (!speechManager.customAudioBuffer) {
            await speechManager.loadCustomAudioFile(customAudioFile);
          }
          speechManager.playCustomAudio(currentTimeRef.current);
        });
      }
    }
  };

  const handleRestart = () => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    currentTimeRef.current = 0;
    progressRef.current = 0;
    setProgress(0);
    setCurrentTime(0);
    startTimeRef.current = null;
    speechManager.stop();
  };

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    progressRef.current = val;
    setProgress(val);
    const t = val * (totalDurationRef.current || 15);
    currentTimeRef.current = t;
    setCurrentTime(t);
    startTimeRef.current = performance.now() - t * 1000;
    if (isPlayingRef.current && audioMode === 'upload' && customAudioFile) {
      speechManager.playCustomAudio(t);
    }
  };

  // ── Video Export ─────────────────────────────────────────────────
  const handleExportVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsExporting(true);
      setIsRecordingVideo(true);
      setExportPercent(0);
      isRecordingRef.current = true;

      // Reset cleanly
      handleRestart();
      await new Promise(r => setTimeout(r, 250));

      videoExporterRef.current = new VideoExporter(canvas);

      let audioStream = null;

      if (audioMode === 'upload' && customAudioFile) {
        await speechManager.loadCustomAudioFile(customAudioFile);
        audioStream = speechManager.getAudioStream();
      } else if (audioMode === 'tts') {
        const text = getTtsTextToSpeak();
        if (text) {
          audioStream = await speechManager.getExportAudioStream(text, selectedVoiceIndex);
        }
      }

      await videoExporterRef.current.startRecording(audioStream);

      // Start playback (ref-first so the render loop picks it up immediately)
      currentTimeRef.current = 0;
      progressRef.current = 0;
      startTimeRef.current = performance.now();
      isPlayingRef.current = true;
      setIsPlaying(true);

      if (audioMode === 'upload') {
        speechManager.playCustomAudio(0);
      }

      const startExportTime = Date.now();
      const targetDurationMs = totalDuration * 1000 + 400;

      const exportTimer = setInterval(async () => {
        const elapsed = Date.now() - startExportTime;
        const pct = Math.min(100, Math.floor((elapsed / targetDurationMs) * 100));
        
        // Use requestAnimationFrame to batch UI updates
        requestAnimationFrame(() => {
          setExportPercent(pct);
          // Also manually update the DOM progress bar to keep rAF alive on aggressive Android devices
          if (progressBarRef.current) progressBarRef.current.value = pct / 100;
        });

        if (elapsed >= targetDurationMs) {
          clearInterval(exportTimer);

          try {
            if (videoExporterRef.current && videoExporterRef.current.isRecording) {
              const res = await videoExporterRef.current.stopRecordingAndDownload('teleprompt_reel', totalDuration);
              setLastExportResult(res);
              setShowExportModal(true);
              confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
            }
          } catch (exportErr) {
            console.error('Export finalization error:', exportErr);
          } finally {
            isRecordingRef.current = false;
            setIsRecordingVideo(false);
            setIsExporting(false);
            handleRestart();
          }
        }
      }, 500);
    } catch (err) {
      console.error('Video export error:', err);
      setIsExporting(false);
      setIsRecordingVideo(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // ── JSX ──────────────────────────────────────────────────────────
  return (
    <div className="canvas-stage flex-1">
      <div className="phone-mockup-wrapper">
        <div className="preview-stage-header">
          {isRecordingVideo ? (
            <div className="recording-indicator">
              <span className="pulse-dot"></span>
              <span>RECORDING REEL... ({exportPercent}%)</span>
            </div>
          ) : (
            <div className="preview-meta-row">
              <span className="preview-aspect-label">STAGE • {aspectRatio}</span>
              <div className="aspect-switcher-inline">
                {['9:16', '16:9', '1:1'].map((ratio) => (
                  <button
                    key={ratio}
                    className={`aspect-mini-btn ${aspectRatio === ratio ? 'active' : ''}`}
                    onClick={() => setAspectRatio && setAspectRatio(ratio)}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={`canvas-container aspect-${aspectRatio.replace(':', '-')}`}>
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="preview-canvas"
          />
        </div>

        <div className="control-bar">
          <button className="play-btn" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
          </button>

          <button className="btn btn-secondary btn-sm restart-btn" onClick={handleRestart} title="Restart">
            <RotateCcw size={14} />
          </button>

          <div className="playback-progress">
            <span ref={timeDisplayRef}>{formatTime(currentTime)}</span>
            <input
              ref={progressBarRef}
              type="range"
              className="range-slider seek-slider"
              min="0"
              max="1"
              step="0.005"
              value={progress}
              onChange={handleSeek}
            />
            <span>{formatTime(totalDuration)}</span>
          </div>

          <button
            className="btn btn-accent btn-sm control-export-btn"
            onClick={handleExportVideo}
            disabled={isExporting || isRecordingVideo}
          >
            <Download size={14} />
            <span className="btn-text">{isExporting ? `${exportPercent}%` : 'Export'}</span>
          </button>
        </div>

        {lastExportResult && (
          <div className="last-export-card">
            <span className="last-export-text">✅ Video Ready!</span>
            <button
              className="btn btn-sm btn-primary save-again-btn"
              onClick={() => setShowExportModal(true)}
            >
              <Film size={14} />
              <span>Watch & Save Reel</span>
            </button>
          </div>
        )}

        {showExportModal && lastExportResult?.blob && (
          <div className="export-modal-backdrop" onClick={() => setShowExportModal(false)}>
            <div className="export-modal" onClick={(e) => e.stopPropagation()}>
              <div className="export-modal-header">
                <div className="export-modal-title">
                  <Film size={22} className="modal-title-icon" />
                  <div>
                    <h4 className="modal-title-heading">Reel Exported!</h4>
                    <p className="modal-title-sub">
                      {lastExportResult.filename} • {(lastExportResult.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                </div>
                <button className="modal-close-btn" onClick={() => setShowExportModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="export-modal-video-box">
                <video
                  src={URL.createObjectURL(lastExportResult.blob)}
                  controls
                  autoPlay
                  playsInline
                  className="export-video-player"
                />
              </div>

              <div className="export-modal-actions">
                <button
                  className="btn btn-primary flex-1 py-2"
                  onClick={async () => {
                    if (Capacitor.isNativePlatform()) {
                      // On Android, explicitly trigger the native Share/Save sheet
                      if (lastExportResult?.uri) {
                        try {
                          await Share.share({
                            title: 'TeleVideo Studio Video',
                            text: 'Your teleprompter reel is ready!',
                            url: lastExportResult.uri,
                            dialogTitle: 'Save Video to Phone or Share'
                          });
                        } catch (e) {
                          console.warn('Share error:', e);
                        }
                      } else {
                        alert('Could not save file natively. Try exporting again.');
                      }
                    } else {
                      // Desktop Web Fallback
                      const url = URL.createObjectURL(lastExportResult.blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = lastExportResult.filename;
                      document.body.appendChild(a);
                      a.click();
                      setTimeout(() => document.body.removeChild(a), 500);
                    }
                  }}
                >
                  {Capacitor.isNativePlatform() ? <Share2 size={16} /> : <Download size={16} />}
                  <span>{Capacitor.isNativePlatform() ? 'Save / Share' : 'Download Video'}</span>
                </button>
              </div>

              <div className="export-modal-tip">
                💡 <strong>Playback Tip:</strong> You can watch and listen to your exported reel right here! If playing the downloaded file offline on Windows or your phone, open it with <strong>Google Chrome</strong>, <strong>Edge</strong>, or <strong>VLC</strong>.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
