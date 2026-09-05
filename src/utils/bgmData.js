/**
 * TeleVideo Studio - 20 Royalty-Free Background Music Presets
 * High-performance Web Audio procedural music synthesis engine.
 * 100% reliable, zero network dependency, 0ms load time, 100% free of CORS or hotlink blocks!
 */

export const BGM_PRESETS = [
  { id: 'none', name: 'No Background Music', genre: 'Silent', icon: 'VolumeX' },
  { id: 'lofi-beats', name: 'Lo-Fi Chill Beats', genre: 'Lo-Fi / Hip Hop', icon: 'Headphones' },
  { id: 'upbeat-pop', name: 'Upbeat Summer Pop', genre: 'Pop / Dance', icon: 'Sparkles' },
  { id: 'cinematic-inspire', name: 'Epic Cinematic Inspiration', genre: 'Cinematic / Orchestral', icon: 'Film' },
  { id: 'tech-future', name: 'Cyberpunk Tech Pulse', genre: 'Electronic / Tech', icon: 'Cpu' },
  { id: 'corporate-growth', name: 'Corporate Growth & Success', genre: 'Business / Motivation', icon: 'TrendingUp' },
  { id: 'synthwave-80s', name: 'Retro 80s Synthwave', genre: 'Synthwave / Retro', icon: 'Radio' },
  { id: 'calm-piano', name: 'Soft Emotional Piano', genre: 'Acoustic / Classical', icon: 'Music' },
  { id: 'hiphop-groove', name: 'Energetic Hip Hop Bounce', genre: 'Hip Hop / Street', icon: 'Zap' },
  { id: 'ambient-space', name: 'Deep Space Ambient Pad', genre: 'Ambient / Relaxation', icon: 'Moon' },
  { id: 'acoustic-vibes', name: 'Warm Acoustic Guitar', genre: 'Acoustic / Folk', icon: 'Sun' },
  { id: 'dramatic-tension', name: 'Dark Dramatic Tension', genre: 'Cinematic / Suspense', icon: 'Flame' },
  { id: 'lofi-night', name: 'Midnight Rainy Lo-Fi', genre: 'Lo-Fi / Ambient', icon: 'CloudRain' },
  { id: 'pop-funk', name: 'Funky Disco Groove', genre: 'Funk / Pop', icon: 'Smile' },
  { id: 'meditation-zen', name: 'Zen Mindfulness Chords', genre: 'Meditation / Spa', icon: 'Heart' },
  { id: 'jazz-cafe', name: 'Smooth Jazz Cafe Piano', genre: 'Jazz / Lounge', icon: 'Coffee' },
  { id: 'trap-booster', name: 'High Energy Trap Beat', genre: 'Trap / Electronic', icon: 'Activity' },
  { id: 'indie-rock', name: 'Upbeat Indie Acoustic Rock', genre: 'Indie / Rock', icon: 'Compass' },
  { id: 'chillwave-sunset', name: 'Golden Hour Chillwave', genre: 'Chillwave / Synth', icon: 'Sunset' },
  { id: 'motivation-drive', name: 'Motivational Gym & Fitness Drive', genre: 'Workout / Rock', icon: 'Award' },
  { id: 'deep-focus', name: 'Lo-Fi Deep Focus Study', genre: 'Study / Focus', icon: 'BookOpen' }
];

// Custom musical chord progressions & timbres for each of the 20 genres
const GENRE_SCALES = {
  'lofi-beats': { freqs: [[261.63, 329.63, 392.0, 493.88], [220.0, 261.63, 329.63, 392.0], [174.61, 220.0, 261.63, 329.63], [196.0, 246.94, 293.66, 349.23]], tempo: 3.5, wave: 'sine', vinyl: true },
  'upbeat-pop': { freqs: [[261.63, 329.63, 392.0], [349.23, 440.0, 523.25], [220.0, 261.63, 329.63], [196.0, 246.94, 293.66]], tempo: 2.0, wave: 'triangle', vinyl: false },
  'cinematic-inspire': { freqs: [[130.81, 196.0, 261.63, 329.63], [110.0, 164.81, 220.0, 261.63], [174.61, 261.63, 349.23], [146.83, 220.0, 293.66]], tempo: 4.5, wave: 'sine', vinyl: false },
  'tech-future': { freqs: [[110.0, 220.0, 277.18], [123.47, 246.94, 293.66], [130.81, 261.63, 329.63], [98.0, 196.0, 246.94]], tempo: 1.5, wave: 'sawtooth', vinyl: false },
  'corporate-growth': { freqs: [[261.63, 329.63, 392.0], [293.66, 369.99, 440.0], [329.63, 392.0, 493.88], [349.23, 440.0, 523.25]], tempo: 3.0, wave: 'sine', vinyl: false },
  'synthwave-80s': { freqs: [[110.0, 164.81, 220.0, 277.18], [146.83, 220.0, 293.66], [174.61, 261.63, 349.23], [130.81, 196.0, 261.63]], tempo: 2.5, wave: 'sawtooth', vinyl: false },
  'calm-piano': { freqs: [[261.63, 329.63, 392.0], [220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [196.0, 246.94, 293.66]], tempo: 4.0, wave: 'sine', vinyl: false },
  'hiphop-groove': { freqs: [[130.81, 164.81, 196.0], [110.0, 130.81, 164.81], [98.0, 123.47, 146.83], [110.0, 146.83, 174.61]], tempo: 2.0, wave: 'triangle', vinyl: true },
  'ambient-space': { freqs: [[130.81, 196.0, 261.63, 392.0], [110.0, 164.81, 246.94, 329.63]], tempo: 5.5, wave: 'sine', vinyl: false },
  'acoustic-vibes': { freqs: [[196.0, 246.94, 293.66, 392.0], [164.81, 196.0, 246.94, 329.63], [174.61, 220.0, 261.63, 349.23], [196.0, 246.94, 293.66]], tempo: 3.2, wave: 'triangle', vinyl: false },
  'dramatic-tension': { freqs: [[87.31, 130.81, 155.56], [73.42, 110.0, 130.81], [65.41, 98.0, 116.54], [87.31, 116.54, 130.81]], tempo: 3.8, wave: 'sawtooth', vinyl: false },
  'lofi-night': { freqs: [[174.61, 220.0, 261.63, 311.13], [146.83, 174.61, 220.0, 261.63], [130.81, 164.81, 196.0, 246.94], [110.0, 146.83, 174.61]], tempo: 3.5, wave: 'sine', vinyl: true },
  'pop-funk': { freqs: [[196.0, 246.94, 293.66, 349.23], [220.0, 277.18, 329.63, 392.0], [174.61, 220.0, 261.63, 329.63]], tempo: 1.8, wave: 'square', vinyl: false },
  'meditation-zen': { freqs: [[130.81, 196.0, 261.63], [164.81, 246.94, 329.63]], tempo: 6.0, wave: 'sine', vinyl: false },
  'jazz-cafe': { freqs: [[261.63, 329.63, 392.0, 493.88, 587.33], [220.0, 261.63, 329.63, 392.0, 493.88], [174.61, 220.0, 261.63, 329.63, 392.0], [196.0, 246.94, 293.66, 349.23, 440.0]], tempo: 3.2, wave: 'sine', vinyl: true },
  'trap-booster': { freqs: [[65.41, 130.81, 155.56], [73.42, 146.83, 174.61], [87.31, 174.61, 196.0]], tempo: 1.6, wave: 'sawtooth', vinyl: false },
  'indie-rock': { freqs: [[164.81, 207.65, 246.94], [174.61, 220.0, 261.63], [196.0, 246.94, 293.66]], tempo: 2.2, wave: 'triangle', vinyl: false },
  'chillwave-sunset': { freqs: [[196.0, 246.94, 293.66, 392.0], [220.0, 261.63, 329.63, 440.0], [174.61, 220.0, 261.63, 349.23]], tempo: 3.5, wave: 'sine', vinyl: false },
  'motivation-drive': { freqs: [[130.81, 196.0, 261.63], [146.83, 220.0, 293.66], [174.61, 261.63, 349.23], [196.0, 293.66, 392.0]], tempo: 2.0, wave: 'sawtooth', vinyl: false },
  'deep-focus': { freqs: [[220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [196.0, 246.94, 293.66], [164.81, 196.0, 246.94]], tempo: 4.0, wave: 'sine', vinyl: true }
};

/**
 * Generate in-memory procedural Web Audio API PCM buffer for 100% reliable BGM tracks.
 */
export function generateProceduralBgmBuffer(audioCtx, durationSec = 30, trackId = 'lofi-beats') {
  const sampleRate = audioCtx.sampleRate || 44100;
  const numSamples = Math.ceil(sampleRate * Math.max(5, durationSec));
  const buffer = audioCtx.createBuffer(2, numSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  const styleCfg = GENRE_SCALES[trackId] || GENRE_SCALES['lofi-beats'];
  const { freqs: chordFreqs, tempo: chordDuration, wave, vinyl } = styleCfg;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const chordIdx = Math.floor(t / chordDuration) % chordFreqs.length;
    const currentChord = chordFreqs[chordIdx];

    let sampleL = 0;
    let sampleR = 0;

    currentChord.forEach((freq, idx) => {
      let osc = 0;
      if (wave === 'sawtooth') {
        osc = (2 * ((freq * t) % 1) - 1) * 0.12;
      } else if (wave === 'square') {
        osc = (((freq * t) % 1) > 0.5 ? 0.10 : -0.10);
      } else if (wave === 'triangle') {
        osc = (Math.abs(4 * ((freq * t) % 1 - 0.5)) - 1) * 0.15;
      } else {
        // Sine
        osc = Math.sin(2 * Math.PI * freq * t) * 0.20;
      }

      const sub = Math.sin(2 * Math.PI * (freq / 2) * t) * 0.10;
      const pan = (idx / (Math.max(1, currentChord.length - 1))) * 0.6 - 0.3;

      sampleL += (osc + sub) * (0.5 - pan);
      sampleR += (osc + sub) * (0.5 + pan);
    });

    // Envelope modulation and vinyl warmth
    const env = vinyl 
      ? 0.85 + 0.15 * Math.sin(2 * Math.PI * 0.25 * t) + (Math.random() * 0.01 - 0.005)
      : 0.88 + 0.12 * Math.sin(2 * Math.PI * 0.2 * t);

    // Rhythm accent
    const beatPhase = (t % (chordDuration / 2)) / (chordDuration / 2);
    const pulse = Math.exp(-beatPhase * 5) * 0.08;

    left[i] = Math.max(-1, Math.min(1, (sampleL * env + pulse) * 0.45));
    right[i] = Math.max(-1, Math.min(1, (sampleR * env + pulse) * 0.45));
  }

  return buffer;
}

/**
 * Convert AudioBuffer to WAV Base64 Data URL for sending to backend FFmpeg exporter
 */
export function audioBufferToBase64Wav(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const dataLength = buffer.length * blockAlign;
  const bufferLength = 44 + dataLength;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  /* WAV Header */
  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Write PCM audio samples
  const channels = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let sample = Math.max(-1, Math.min(1, channels[ch][i]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, sample, true);
      offset += 2;
    }
  }

  // Convert ArrayBuffer to Base64
  let binary = '';
  const bytes = new Uint8Array(arrayBuffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}
