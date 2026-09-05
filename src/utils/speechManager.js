import { generateProceduralBgmBuffer } from './bgmData';

const TTS_VOICES = [
  { name: 'Brian (UK Male)', id: 'Brian' },
  { name: 'Amy (UK Female)', id: 'Amy' },
  { name: 'Joanna (US Female)', id: 'Joanna' },
  { name: 'Joey (US Male)', id: 'Joey' },
  { name: 'Matthew (US Male)', id: 'Matthew' },
  { name: 'Kendra (US Female)', id: 'Kendra' },
  { name: 'Nicole (AU Female)', id: 'Nicole' },
  { name: 'Russell (AU Male)', id: 'Russell' }
];

class SpeechManager {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.browserVoices = [];
    this.currentUtterance = null;
    this.isSpeaking = false;
    
    // Web Audio API Context & Destination Stream for Video Export
    this.audioCtx = null;
    this.destinationNode = null;
    this.connectedAudioElements = new Set();
    this.exportAudioElement = null;

    // Mic recording state
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecordingAudio = false;

    // Background Music (BGM) state
    this.bgmAudioElement = null;
    this.bgmGainNode = null;
    this.bgmSourceNode = null;

    if (this.synth) {
      this.loadBrowserVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadBrowserVoices();
      }
    }
  }

  initAudioContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
        this.destinationNode = this.audioCtx.createMediaStreamDestination();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  async ensureAudioContext() {
    this.initAudioContext();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume();
      } catch (e) {
        console.warn('AudioContext resume error:', e);
      }
    }
    return this.audioCtx;
  }

  getAudioStream() {
    this.initAudioContext();
    if (
      !this.destinationNode ||
      !this.destinationNode.stream ||
      !this.destinationNode.stream.getAudioTracks()[0] ||
      this.destinationNode.stream.getAudioTracks()[0].readyState === 'ended'
    ) {
      if (this.audioCtx) {
        this.destinationNode = this.audioCtx.createMediaStreamDestination();
      }
    }
    return this.destinationNode ? this.destinationNode.stream : null;
  }

  loadBrowserVoices() {
    if (!this.synth) return [];
    this.browserVoices = this.synth.getVoices().filter(v => 
      v.lang.startsWith('en') || v.lang.startsWith('es') || v.lang.startsWith('fr') || v.lang.startsWith('de') || v.lang.startsWith('hi')
    );
    return this.browserVoices;
  }

  getVoices() {
    const list = this.loadBrowserVoices();
    if (list.length > 0) return list;
    return [
      { name: 'Default English Voice', lang: 'en-US' },
      { name: 'Microsoft David - English (United States)', lang: 'en-US' },
      { name: 'Microsoft Zira - English (United States)', lang: 'en-US' },
      { name: 'Google US English', lang: 'en-US' }
    ];
  }

  getTtsVoiceList() {
    return this.getVoices();
  }

  // Live Playback Engine (Instant Web Speech API)
  speak(text, options = {}) {
    const {
      voiceIndex = 0,
      rate = 1.0,
      pitch = 1.0,
      onProgress = () => {},
      onEnd = () => {},
      onError = () => {}
    } = options;

    this.stop();

    if (!text || text.trim() === '') return;

    if (!this.synth) {
      console.warn('SpeechSynthesis is not supported in this browser.');
      return;
    }

    this.synth.cancel();

    this.currentUtterance = new SpeechSynthesisUtterance(text);
    const availableVoices = this.getVoices();

    if (availableVoices[voiceIndex] && availableVoices[voiceIndex].voiceURI) {
      this.currentUtterance.voice = availableVoices[voiceIndex];
    } else if (this.browserVoices[voiceIndex]) {
      this.currentUtterance.voice = this.browserVoices[voiceIndex];
    }

    this.currentUtterance.rate = rate;
    this.currentUtterance.pitch = pitch;

    this.currentUtterance.onend = () => {
      this.isSpeaking = false;
      onEnd();
    };

    this.currentUtterance.onerror = (err) => {
      this.isSpeaking = false;
      onError(err);
    };

    this.isSpeaking = true;
    this.synth.speak(this.currentUtterance);
  }

  // Connect uploaded custom HTML5 <audio> element to Web Audio destination stream
  connectAudioElement(audioElement) {
    if (!audioElement) return;
    this.initAudioContext();

    if (this.audioCtx && this.destinationNode) {
      if (!this.connectedAudioElements.has(audioElement)) {
        try {
          const source = this.audioCtx.createMediaElementSource(audioElement);
          source.connect(this.audioCtx.destination); // Speaker output
          source.connect(this.destinationNode);     // Video Exporter MediaRecorder stream
          this.connectedAudioElements.add(audioElement);
        } catch (e) {
          console.warn('MediaElementSource already connected:', e);
        }
      }
    }
  }

  // Load and decode custom uploaded audio file for pristine, stall-free streaming
  async loadCustomAudioFile(file) {
    if (!file) return null;
    await this.ensureAudioContext();
    try {
      const arrayBuffer = await file.arrayBuffer();
      this.customAudioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
      return this.customAudioBuffer;
    } catch (e) {
      console.warn('Audio decoding error:', e);
      return null;
    }
  }

  playCustomAudio(startTime = 0) {
    this.stopCustomAudio();
    if (this.audioCtx && this.customAudioBuffer) {
      if (
        !this.destinationNode ||
        !this.destinationNode.stream ||
        !this.destinationNode.stream.getAudioTracks()[0] ||
        this.destinationNode.stream.getAudioTracks()[0].readyState === 'ended'
      ) {
        this.destinationNode = this.audioCtx.createMediaStreamDestination();
      }
      this.customAudioSource = this.audioCtx.createBufferSource();
      this.customAudioSource.buffer = this.customAudioBuffer;
      this.customAudioSource.connect(this.audioCtx.destination);
      this.customAudioSource.connect(this.destinationNode);
      this.customAudioSource.start(0, Math.max(0, startTime));
      return true;
    }
    return false;
  }

  stopCustomAudio() {
    if (this.customAudioSource) {
      try {
        this.customAudioSource.stop();
        this.customAudioSource.disconnect();
      } catch (e) {}
      this.customAudioSource = null;
    }
  }

  // Stream Neural AI Voice directly into Video Exporter via AudioBufferSource
  async getExportAudioStream(text, voiceIndex = 0) {
    if (!text || text.trim() === '') return null;
    await this.ensureAudioContext();

    const selectedVoiceObj = TTS_VOICES[voiceIndex] || TTS_VOICES[0];
    const voiceId = selectedVoiceObj.id || 'Brian';
    const encodedText = encodeURIComponent(text.trim());

    try {
      const url = `https://api.streamelements.com/kappa/v2/speech?voice=${voiceId}&text=${encodedText}`;
      const response = await fetch(url);

      if (response.ok) {
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);

        if (
          !this.destinationNode ||
          !this.destinationNode.stream ||
          !this.destinationNode.stream.getAudioTracks()[0] ||
          this.destinationNode.stream.getAudioTracks()[0].readyState === 'ended'
        ) {
          this.destinationNode = this.audioCtx.createMediaStreamDestination();
        }

        this.stopCustomAudio();
        this.customAudioSource = this.audioCtx.createBufferSource();
        this.customAudioSource.buffer = audioBuffer;
        this.customAudioSource.connect(this.audioCtx.destination);
        this.customAudioSource.connect(this.destinationNode);
        this.customAudioSource.start(0);

        return this.destinationNode.stream;
      }
    } catch (err) {
      console.warn('Network TTS export stream fallback:', err);
    }

    return this.getAudioStream();
  }

  pause() {
    if (this.audioCtx && this.audioCtx.state === 'running') {
      this.audioCtx.suspend();
    }
    if (this.synth && this.isSpeaking) {
      this.synth.pause();
    }
    if (this.exportAudioElement) {
      this.exportAudioElement.pause();
    }
    this.stopCustomAudio();
  }

  resume() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
    if (this.exportAudioElement) {
      this.exportAudioElement.play();
    }
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    if (this.exportAudioElement) {
      this.exportAudioElement.pause();
      this.exportAudioElement = null;
    }
    this.stopCustomAudio();
    this.stopBgm();
    this.isSpeaking = false;
  }

  // Microphone Voice Recording
  async startMicRecording(onStreamReady = () => {}) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(stream);
      
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.start();
      this.isRecordingAudio = true;
      onStreamReady(stream);
      return stream;
    } catch (err) {
      console.error('Microphone access error:', err);
      throw err;
    }
  }

  stopMicRecording() {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecordingAudio) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        this.isRecordingAudio = false;
        resolve(blob);
      };

      this.mediaRecorder.stop();
      if (this.mediaRecorder.stream) {
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
    });
  }

  // ── Background Music (BGM) Live Routing & Control ──────────────────
  async playBgm(audioSrc, volume = 0.20, trackId = 'lofi-beats') {
    this.stopBgm();
    if (!audioSrc && !trackId) return;
    await this.ensureAudioContext();

    try {
      this.bgmGainNode = this.audioCtx.createGain();
      this.bgmGainNode.gain.value = Math.max(0, Math.min(1, volume));

      if (audioSrc instanceof File || audioSrc instanceof Blob || (typeof audioSrc === 'string' && audioSrc.startsWith('http'))) {
        this.bgmAudioElement = new Audio();
        this.bgmAudioElement.crossOrigin = 'anonymous';
        this.bgmAudioElement.loop = true;
        this.bgmAudioElement.src = typeof audioSrc === 'string' ? audioSrc : URL.createObjectURL(audioSrc);

        this.bgmSourceNode = this.audioCtx.createMediaElementSource(this.bgmAudioElement);
        this.bgmSourceNode.connect(this.bgmGainNode);
        await this.bgmAudioElement.play();
      } else {
        // Render procedural synth buffer for 100% reliable 20 genre presets!
        const buffer = generateProceduralBgmBuffer(this.audioCtx, 60, trackId || 'lofi-beats');
        const bufferSource = this.audioCtx.createBufferSource();
        bufferSource.buffer = buffer;
        bufferSource.loop = true;
        bufferSource.connect(this.bgmGainNode);
        bufferSource.start(0);
        this.bgmSourceNode = bufferSource;
      }

      this.bgmGainNode.connect(this.audioCtx.destination);
      if (this.destinationNode) {
        this.bgmGainNode.connect(this.destinationNode);
      }
    } catch (err) {
      console.warn('BGM live playback error:', err);
    }
  }

  setBgmVolume(volume) {
    const vol = Math.max(0, Math.min(1, parseFloat(volume)));
    if (this.bgmGainNode && this.audioCtx) {
      this.bgmGainNode.gain.setValueAtTime(vol, this.audioCtx.currentTime);
    }
  }

  stopBgm() {
    if (this.bgmAudioElement) {
      try {
        this.bgmAudioElement.pause();
        this.bgmAudioElement.src = '';
      } catch (e) {}
      this.bgmAudioElement = null;
    }
    if (this.bgmSourceNode) {
      try {
        this.bgmSourceNode.disconnect();
      } catch (e) {}
      this.bgmSourceNode = null;
    }
    if (this.bgmGainNode) {
      try {
        this.bgmGainNode.disconnect();
      } catch (e) {}
      this.bgmGainNode = null;
    }
  }
}

export const speechManager = new SpeechManager();
