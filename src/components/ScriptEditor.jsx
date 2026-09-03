import React, { useState, useEffect } from 'react';
import { FileText, Mic, Volume2, Upload, CheckSquare, Square, VolumeX } from 'lucide-react';
import { speechManager } from '../utils/speechManager';

const SAMPLE_SCRIPTS = [
  {
    title: '🚀 Tech Productivity Tip',
    text: `Want to boost your productivity by 10x? Here is the secret workflow top developers use daily.\nFirst, automate repetitive tasks using smart scripts.\nSecond, break big goals into focused 15-minute execution sprints.\nAnd third, turn off all notifications during deep work mode!\nFollow for more creator hacks!`
  },
  {
    title: '🔥 Daily Motivation',
    text: `The difference between who you are and who you want to be is what you do every single day.\nStop waiting for perfect timing because timing is never perfect.\nStart small, stay consistent, and let your results speak louder than your words!`
  },
  {
    title: '⚡ Breaking Tech Short',
    text: `Breaking news in creative tech today!\nArtificial Intelligence agents can now render full 60 frames-per-second short-form teleprompter videos directly inside your browser.\nPaste your script, customize kinetic words, and record loud and clear!`
  },
  {
    title: '✨ Product Launch Reel',
    text: `Introducing TeleVideo Studio!\nThe ultimate short-form video teleprompter engine designed for YouTube Shorts, Reels, and TikTok.\nRead your text loud and clear with dynamic word highlighting and instant WebM video export.`
  }
];

export default function ScriptEditor({
  scriptText,
  setScriptText,
  audioMode,
  setAudioMode,
  selectedVoiceIndex,
  setSelectedVoiceIndex,
  speechRate,
  setSpeechRate,
  onStartMicRecording,
  onStopMicRecording,
  isRecordingAudio,
  customAudioFile,
  setCustomAudioFile,

  // TTS Line Selection Props
  ttsRangeMode,
  setTtsRangeMode,
  selectedTtsLines,
  setSelectedTtsLines
}) {
  const [voices, setVoices] = useState([]);
  const [wordCount, setWordCount] = useState(0);
  const [estDuration, setEstDuration] = useState(0);

  // Parse lines from scriptText
  const scriptLines = scriptText.split('\n').filter(l => l.trim().length > 0);

  useEffect(() => {
    const vList = speechManager.getVoices();
    setVoices(vList);
  }, []);

  useEffect(() => {
    const words = scriptText.trim().split(/\s+/).filter(w => w.length > 0);
    const count = words.length;
    setWordCount(count);
    const duration = Math.ceil((count / 150) * 60);
    setEstDuration(duration);
  }, [scriptText]);

  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCustomAudioFile(file);
      setAudioMode('upload');
    }
  };

  const toggleLineSelection = (index) => {
    const newSet = new Set(selectedTtsLines);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedTtsLines(newSet);
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">
          <FileText size={18} className="text-indigo-400" />
          <span>Script & Teleprompter</span>
        </span>
        <div className="text-xs text-gray-400 font-mono">
          {wordCount} words (~{estDuration}s)
        </div>
      </div>

      <div className="panel-body">
        {/* Sample Script Selectors */}
        <div className="form-group">
          <label className="form-label">Quick Sample Scripts</label>
          <div className="grid grid-cols-2 gap-2">
            {SAMPLE_SCRIPTS.map((sample, idx) => (
              <button
                key={idx}
                className="btn btn-secondary btn-sm text-left text-xs truncate"
                onClick={() => {
                  setScriptText(sample.text);
                  // Reset line selection default
                  setSelectedTtsLines(new Set([0]));
                }}
              >
                {sample.title}
              </button>
            ))}
          </div>
        </div>

        {/* Script Textarea */}
        <div className="form-group">
          <label className="form-label">
            <span>Teleprompter Script</span>
            <span className="form-label-val">Paste or Type</span>
          </label>
          <textarea
            className="form-textarea"
            placeholder="Type or paste your script here... (e.g. Read loud and clear for your viewers)"
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
          />
        </div>

        {/* Audio Mode Tabs */}
        <div className="form-group">
          <label className="form-label">Audio / Voiceover Source</label>
          <div className="tabs-header">
            <button
              className={`tab-btn ${audioMode === 'tts' ? 'active' : ''}`}
              onClick={() => setAudioMode('tts')}
            >
              <Volume2 size={14} />
              <span>AI Voice (TTS)</span>
            </button>
            <button
              className={`tab-btn ${audioMode === 'mic' ? 'active' : ''}`}
              onClick={() => setAudioMode('mic')}
            >
              <Mic size={14} />
              <span>Live Mic</span>
            </button>
            <button
              className={`tab-btn ${audioMode === 'upload' ? 'active' : ''}`}
              onClick={() => setAudioMode('upload')}
            >
              <Upload size={14} />
              <span>Upload Track</span>
            </button>
          </div>
        </div>

        {/* Audio Option Configurations */}
        {audioMode === 'tts' && (
          <div className="card space-y-3">
            <div className="form-group">
              <label className="form-label">AI Voice Selection</label>
              <select
                className="form-select"
                value={selectedVoiceIndex}
                onChange={(e) => setSelectedVoiceIndex(Number(e.target.value))}
              >
                {voices.length === 0 ? (
                  <option value={0}>Default Browser Voice</option>
                ) : (
                  voices.map((v, i) => (
                    <option key={i} value={i}>
                      {v.name} ({v.lang})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* TTS Voiceover Scope / Range Picker */}
            <div className="form-group">
              <label className="form-label">Voiceover Scope (Which lines AI reads)</label>
              <select
                className="form-select"
                value={ttsRangeMode}
                onChange={(e) => setTtsRangeMode(e.target.value)}
              >
                <option value="first-line">🎯 Hook / First Line Only (Audience reads rest)</option>
                <option value="first-two">🎯 First 2 Lines Only</option>
                <option value="custom">📋 Custom Selective Line Picker...</option>
                <option value="full">🔊 Read Entire Script</option>
              </select>
            </div>

            {/* Interactive Custom Line Selection List */}
            {ttsRangeMode === 'custom' && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                <span className="text-[11px] text-gray-400 font-semibold block mb-1">
                  Select lines for AI Voiceover:
                </span>
                {scriptLines.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No text lines found.</p>
                ) : (
                  scriptLines.map((line, idx) => {
                    const isSelected = selectedTtsLines.has(idx);
                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-2 p-2 rounded-md border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-950/40 border-indigo-500/50 text-white'
                            : 'bg-gray-900/40 border-gray-800 text-gray-400 opacity-60'
                        }`}
                        onClick={() => toggleLineSelection(idx)}
                      >
                        <button className="mt-0.5 text-indigo-400">
                          {isSelected ? <CheckSquare size={15} /> : <Square size={15} />}
                        </button>
                        <div className="flex-1 leading-snug">
                          <span className="font-mono text-[10px] text-indigo-300 mr-1.5">
                            Line {idx + 1}:
                          </span>
                          <span>{line}</span>
                        </div>
                        {isSelected ? (
                          <Volume2 size={13} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <VolumeX size={13} className="text-gray-500 flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                <span>Speech Speed (Rate)</span>
                <span className="form-label-val">{speechRate}x</span>
              </label>
              <input
                type="range"
                className="range-slider"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              />
            </div>
          </div>
        )}

        {audioMode === 'mic' && (
          <div className="card flex flex-col items-center gap-3 text-center">
            <p className="text-xs text-gray-400">
              Record your voice live through your microphone while reading the teleprompter.
            </p>
            {isRecordingAudio ? (
              <button className="btn btn-danger btn-sm" onClick={onStopMicRecording}>
                <StopCircle size={16} />
                <span>Stop Recording</span>
              </button>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={onStartMicRecording}>
                <Mic size={16} />
                <span>Start Mic Voiceover</span>
              </button>
            )}
          </div>
        )}

        {audioMode === 'upload' && (
          <div className="card space-y-2 text-center">
            <p className="text-xs text-gray-400">
              Upload an MP3/WAV file for background music or pre-recorded voiceover.
            </p>
            <input
              type="file"
              accept="audio/*"
              className="form-input text-xs"
              onChange={handleAudioUpload}
            />
            {customAudioFile && (
              <p className="text-xs text-indigo-400 font-semibold truncate">
                Loaded: {customAudioFile.name}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
