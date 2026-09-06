import React, { useState, useEffect, useRef } from 'react';
import { FileText, Mic, Volume2, Upload, CheckSquare, Square, VolumeX, Trash2, Play, Pause } from 'lucide-react';
import { saveCustomAudio, getCustomAudios, deleteCustomAudio } from '../utils/storageDB';
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
  const [savedAudios, setSavedAudios] = useState([]);
  
  // Audio Preview State
  const [previewId, setPreviewId] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    // Cleanup preview audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePreview = (e, audioObj) => {
    e.stopPropagation();
    if (previewId === audioObj.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPreviewId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const url = URL.createObjectURL(audioObj.blob);
      const a = new Audio(url);
      a.onended = () => setPreviewId(null);
      a.play();
      audioRef.current = a;
      setPreviewId(audioObj.id);
    }
  };

  useEffect(() => {
    // Attempt to load system voices
    const populateVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };
    populateVoices();
    window.speechSynthesis.onvoiceschanged = populateVoices;

    // Load custom audios from DB
    getCustomAudios().then(audios => setSavedAudios(audios || [])).catch(e => console.error(e));
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
        {/* Sample Script Selectors & Drafts */}
        <div className="form-group">
          <label className="form-label">Quick Scripts & Drafts</label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {SAMPLE_SCRIPTS.map((sample, idx) => (
              <button
                key={idx}
                className="btn btn-secondary btn-sm text-left text-xs truncate"
                onClick={() => {
                  setScriptText(sample.text);
                  setSelectedTtsLines(new Set([0]));
                }}
              >
                {sample.title}
              </button>
            ))}
          </div>
          <button
            className="w-full py-2 px-3 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition-all text-xs font-bold flex justify-center items-center gap-2"
            onClick={() => {
              const btn = document.getElementById('btn-open-drafts');
              if (btn) btn.click();
            }}
          >
            <FileText size={14} />
            View Draft History
          </button>
        </div>

        {/* Script Textarea */}
        <div className="form-group flex-1 min-h-[300px] flex flex-col">
          <label className="form-label mb-2 text-indigo-200">
            <span>Editor</span>
            <span className="form-label-val text-xs text-indigo-400 font-normal">Markdown Supported</span>
          </label>
          <div className="relative flex-1 rounded-xl overflow-hidden border border-gray-700/60 bg-[#0f1115] focus-within:border-indigo-500/80 focus-within:shadow-[0_0_15px_rgba(139,92,246,0.15)] transition-all">
            {/* Fake Gutter for IDE Look */}
            <div className="absolute top-0 left-0 bottom-0 w-8 bg-[#181b21] border-r border-gray-800/80 flex flex-col items-center py-4 text-[10px] text-gray-600 font-mono select-none pointer-events-none">
              1<br/>2<br/>3<br/>4<br/>5<br/>6<br/>7<br/>8<br/>9<br/>10<br/>11
            </div>
            <textarea
              id="script-section"
              className="w-full h-full min-h-[300px] bg-transparent text-gray-200 p-4 pl-12 text-sm leading-relaxed resize-none outline-none font-mono"
              placeholder="Type or paste your script here..."
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
            />
          </div>
        </div>

        {/* Audio Mode Tabs */}
        <div id="audio-section" className="form-group mt-4">
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
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">Your Saved Voiceovers</span>
              <span className="text-[10px] text-gray-500 font-mono">{savedAudios.length}/10</span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
              {/* Upload New Button */}
              <label className="snap-start flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center gap-1 p-1 transition-all relative overflow-hidden border-2 border-dashed border-gray-600 hover:border-indigo-400 bg-gray-800/30 cursor-pointer group">
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const newId = 'audio-' + Date.now();
                      try {
                        await saveCustomAudio(newId, file.name, file);
                        const newSaved = await getCustomAudios();
                        setSavedAudios(newSaved);
                        setCustomAudioFile(file); // Set active immediately
                      } catch (err) {
                        console.error('Failed to save audio:', err);
                        alert('Could not save file. It might be too large.');
                      }
                    }
                  }}
                />
                <Upload size={16} className="text-gray-400 group-hover:text-indigo-400" />
                <span className="text-[9px] font-bold text-center leading-tight">Upload<br/>New</span>
              </label>

              {/* Saved Audio Cards */}
              {savedAudios.map((audio) => {
                // Check if the current customAudioFile matches this saved audio (by name or size)
                const isActive = customAudioFile && (customAudioFile.name === audio.name || customAudioFile.size === audio.blob.size);
                return (
                  <button
                    key={audio.id}
                    onClick={() => {
                      // Ensure the blob has a name property for the backend/UI if it was lost in IDB
                      const fileBlob = audio.blob;
                      if (!fileBlob.name) fileBlob.name = audio.name;
                      setCustomAudioFile(fileBlob);
                    }}
                    className={`snap-start flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center gap-1 p-1 transition-all relative overflow-hidden group ${
                      isActive 
                        ? 'border-2 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
                        : 'border border-gray-700/50 hover:border-gray-500'
                    }`}
                  >
                    <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity bg-gradient-to-br from-indigo-600 to-purple-800" />
                    <Volume2 size={16} className={isActive ? 'text-indigo-400 animate-pulse' : 'text-gray-400'} />
                    <span className="text-[9px] font-bold text-center leading-tight z-10 truncate w-full px-1" title={audio.name}>{audio.name}</span>
                    <span className="text-[7px] text-indigo-400 uppercase tracking-wider z-10">Saved</span>
                    
                    {/* Play/Pause Preview Button (Centered) */}
                    <button
                      className={`absolute inset-0 m-auto w-8 h-8 flex items-center justify-center rounded-full bg-indigo-500/90 text-white transition-all z-20 hover:bg-indigo-400 hover:scale-110 shadow-lg ${
                        previewId === audio.id ? 'opacity-100 scale-100' : 'opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100'
                      }`}
                      onClick={(e) => handlePreview(e, audio)}
                      title={previewId === audio.id ? "Stop Preview" : "Play Preview"}
                    >
                      {previewId === audio.id ? <Pause fill="white" size={14} /> : <Play fill="white" size={14} className="ml-0.5" />}
                    </button>

                    {/* Delete Button */}
                    <span 
                      className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-rose-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity z-30 hover:bg-rose-500 cursor-pointer"
                      title="Delete saved track"
                      onClick={async (e) => {
                        e.stopPropagation();
                        // Stop if currently playing
                        if (previewId === audio.id) {
                          if (audioRef.current) audioRef.current.pause();
                          setPreviewId(null);
                        }
                        await deleteCustomAudio(audio.id);
                        const newSaved = await getCustomAudios();
                        setSavedAudios(newSaved);
                        if (isActive) setCustomAudioFile(null);
                      }}
                    >
                      <Trash2 size={9} />
                    </span>
                  </button>
                );
              })}
            </div>

            {!customAudioFile && savedAudios.length === 0 && (
              <p className="text-xs text-gray-400 text-center mt-2">
                Upload an MP3/WAV file for pre-recorded voiceover.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
