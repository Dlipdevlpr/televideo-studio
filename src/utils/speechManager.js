/**
 * TeleVideo Studio - Speech & Audio Manager
 * Multi-source Web Audio router for custom audio uploads, TTS speech, and microphone tracks.
 */

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

  getAudioStream() {
    this.initAudioContext();
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

  // Stream Neural AI Voice directly into Video Exporter
  async getExportAudioStream(text, voiceIndex = 0) {
    if (!text || text.trim() === '') return null;
    this.initAudioContext();

    const selectedVoiceObj = TTS_VOICES[voiceIndex] || TTS_VOICES[0];
    const voiceId = selectedVoiceObj.id || 'Brian';
    const encodedText = encodeURIComponent(text.trim());

    try {
      const url = `https://api.streamelements.com/kappa/v2/speech?voice=${voiceId}&text=${encodedText}`;
      const response = await fetch(url);

      if (response.ok) {
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        
        if (this.exportAudioElement) {
          this.exportAudioElement.pause();
        }

        this.exportAudioElement = new Audio(audioUrl);
        this.exportAudioElement.crossOrigin = 'anonymous';

        const source = this.audioCtx.createMediaElementSource(this.exportAudioElement);
        source.connect(this.audioCtx.destination);
        source.connect(this.destinationNode);

        this.exportAudioElement.play();

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
}

export const speechManager = new SpeechManager();
