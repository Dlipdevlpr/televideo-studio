import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Download, Radio, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { renderTeleprompterCanvas } from '../utils/teleprompterEngine';
import { speechManager } from '../utils/speechManager';
import { VideoExporter } from '../utils/videoRecorder';

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
  const audioRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 1
  const [currentTime, setCurrentTime] = useState(0); // in seconds
  const [totalDuration, setTotalDuration] = useState(15); // in seconds
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [exportPercent, setExportPercent] = useState(0);

  // Refs for animation & closure-safe values
  const animFrameIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const videoExporterRef = useRef(null);
  const progressRef = useRef(0);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Calculate total reading duration based on word count & WPM
  useEffect(() => {
    const words = scriptText.trim().split(/\s+/).filter(w => w.length > 0).length;
    const durationSeconds = Math.max(5, Math.ceil((words / speedWpm) * 60));
    setTotalDuration(durationSeconds);
  }, [scriptText, speedWpm]);

  // Set Canvas internal dimensions based on aspect ratio
  const getCanvasDimensions = () => {
    if (aspectRatio === '16:9') return { width: 1280, height: 720 };
    if (aspectRatio === '1:1') return { width: 1080, height: 1080 };
    return { width: 720, height: 1280 }; // Default 9:16 Shorts/Reels
  };

  const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions();

  // Helper to extract exact text for TTS based on scope
  const getTtsTextToSpeak = () => {
    const lines = scriptText.split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) return '';

    if (ttsRangeMode === 'first-line') {
      return lines[0] || '';
    } else if (ttsRangeMode === 'first-two') {
      return lines.slice(0, 2).join('. ');
    } else if (ttsRangeMode === 'custom') {
      const selectedText = lines
        .filter((_, idx) => selectedTtsLines.has(idx))
        .join('. ');
      return selectedText || lines[0] || '';
    }
    return scriptText; // 'full'
  };

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const render = (timestamp) => {
      if (isPlaying) {
        if (!startTimeRef.current) startTimeRef.current = timestamp - currentTime * 1000;
        const elapsed = (timestamp - startTimeRef.current) / 1000;
        setCurrentTime(elapsed);

        const newProgress = Math.min(1, elapsed / totalDuration);
        setProgress(newProgress);

        if (newProgress >= 1) {
          setIsPlaying(false);
          speechManager.stop();
          if (audioRef.current) {
            audioRef.current.pause();
          }
        }
      }

      renderTeleprompterCanvas(ctx, {
        width: canvasWidth,
        height: canvasHeight,
        scriptText,
        progress,
        currentTime,
        aspectRatio,
        scrollMode,
        fontFamily,
        fontSize,
        textColor,
        highlightColor,
        activeLineBg,
        boxOpacity,
        textPosition,
        bgTheme,
        solidBgColor,
        showProgressBar,
        showAudioVisualizer,
        watermarkText,
        showWatermark,
        showReadingBox,
        boxScale,
        boxWidthPercent,
        boxBorderRadius,
        boxBorderWidth
      });

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [
    isPlaying,
    currentTime,
    progress,
    totalDuration,
    canvasWidth,
    canvasHeight,
    scriptText,
    aspectRatio,
    scrollMode,
    fontFamily,
    fontSize,
    textColor,
    highlightColor,
    activeLineBg,
    boxOpacity,
    textPosition,
    bgTheme,
    solidBgColor,
    showProgressBar,
    showAudioVisualizer,
    watermarkText,
    showWatermark,
    showReadingBox,
    boxScale,
    boxWidthPercent,
    boxBorderRadius,
    boxBorderWidth
  ]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      speechManager.pause();
      if (audioRef.current) audioRef.current.pause();
    } else {
      if (progress >= 1) {
        setProgress(0);
        setCurrentTime(0);
        startTimeRef.current = null;
      }
      setIsPlaying(true);

      // Trigger Voiceover audio if enabled
      if (audioMode === 'tts') {
        const textToSpeak = getTtsTextToSpeak();
        if (textToSpeak) {
          speechManager.speak(textToSpeak, {
            voiceIndex: selectedVoiceIndex,
            rate: speechRate
          });
        }
      } else if (audioMode === 'upload' && customAudioFile) {
        if (!audioRef.current) {
          audioRef.current = new Audio(URL.createObjectURL(customAudioFile));
        }
        speechManager.connectAudioElement(audioRef.current);
        audioRef.current.play();
      }
    }
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    startTimeRef.current = null;
    speechManager.stop();
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.pause();
    }
  };

  const handleSeek = (e) => {
    const newProgress = parseFloat(e.target.value);
    setProgress(newProgress);
    const newTime = newProgress * totalDuration;
    setCurrentTime(newTime);
    startTimeRef.current = performance.now() - newTime * 1000;
  };

  // Video Export Handler with Audio Multiplexing for Custom Uploaded Audio & TTS
  const handleExportVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsExporting(true);
      setIsRecordingVideo(true);
      setExportPercent(0);

      // Reset state & restart cleanly
      handleRestart();
      progressRef.current = 0;
      await new Promise(r => setTimeout(r, 250));

      videoExporterRef.current = new VideoExporter(canvas);

      let audioStream = null;

      // Case 1: Custom uploaded audio track (MP3/WAV)
      if (audioMode === 'upload' && customAudioFile) {
        if (!audioRef.current) {
          audioRef.current = new Audio(URL.createObjectURL(customAudioFile));
        }
        audioRef.current.currentTime = 0;
        speechManager.connectAudioElement(audioRef.current);
        audioStream = speechManager.getAudioStream();
      } 
      // Case 2: AI Voice (TTS)
      else if (audioMode === 'tts') {
        const textToSpeak = getTtsTextToSpeak();
        if (textToSpeak) {
          audioStream = await speechManager.getExportAudioStream(textToSpeak, selectedVoiceIndex);
        }
      }

      // Start recording with audio stream
      await videoExporterRef.current.startRecording(audioStream);

      // Trigger playback animation & play custom audio synchronously
      setIsPlaying(true);
      startTimeRef.current = performance.now();

      if (audioMode === 'upload' && audioRef.current) {
        audioRef.current.play();
      }

      const startExportTime = Date.now();
      const targetDurationMs = totalDuration * 1000 + 400;

      const exportTimer = setInterval(async () => {
        const elapsed = Date.now() - startExportTime;
        const currentPct = Math.min(100, Math.floor((elapsed / targetDurationMs) * 100));
        setExportPercent(currentPct);

        // Record for the complete duration of the script reel
        if (elapsed >= targetDurationMs) {
          clearInterval(exportTimer);

          if (videoExporterRef.current && videoExporterRef.current.isRecording) {
            await videoExporterRef.current.stopRecordingAndDownload('teleprompt_reel');
            setIsRecordingVideo(false);
            setIsExporting(false);
            handleRestart();

            confetti({
              particleCount: 90,
              spread: 70,
              origin: { y: 0.6 }
            });
          }
        }
      }, 150);

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

  return (
    <div className="canvas-stage flex-1">
      <div className="phone-mockup-wrapper">
        <div className="flex items-center gap-2 mb-2">
          {isRecordingVideo ? (
            <div className="recording-indicator">
              <span className="pulse-dot"></span>
              <span>RECORDING REEL... ({exportPercent}%)</span>
            </div>
          ) : (
            <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
              <span>Live Teleprompter Studio ({aspectRatio})</span>
              {audioMode === 'tts' && ttsRangeMode !== 'full' && (
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/40">
                  🔊 TTS Scope: {ttsRangeMode === 'first-line' ? 'Hook Only' : ttsRangeMode === 'first-two' ? 'First 2 Lines' : 'Selective Lines'}
                </span>
              )}
              {audioMode === 'upload' && customAudioFile && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  🎵 Custom Voiceover Audio Attached
                </span>
              )}
            </span>
          )}
        </div>

        <div
          className="canvas-container"
          style={{
            aspectRatio: aspectRatio === '9:16' ? '9/16' : aspectRatio === '16:9' ? '16/9' : '1/1',
            maxHeight: aspectRatio === '16:9' ? '50vh' : '70vh'
          }}
        >
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

          <button className="btn btn-secondary btn-sm" onClick={handleRestart} title="Restart">
            <RotateCcw size={14} />
          </button>

          <div className="playback-progress">
            <span>{formatTime(currentTime)}</span>
            <input
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
            className="btn btn-accent btn-sm ml-2 hidden sm:flex"
            onClick={handleExportVideo}
            disabled={isExporting || isRecordingVideo}
          >
            <Download size={14} />
            <span>{isExporting ? `Exporting (${exportPercent}%)...` : 'Export'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
