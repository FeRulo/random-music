let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

export function getAudioContext(): AudioContext {
  return getCtx();
}

export function initAudio() {
  // Call on first user interaction to satisfy browser autoplay policy
  getCtx();
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.25,
) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, c.currentTime);
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + duration);
}

export function playCorrect() {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.frequency.setValueAtTime(523, c.currentTime);
  osc.frequency.setValueAtTime(784, c.currentTime + 0.07);
  gain.gain.setValueAtTime(0.25, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.3);
}

export function playWrong() {
  playTone(160, 0.25, 'sawtooth', 0.18);
}

// Frequency tables keyed by adjustedIndex (= staffIndex - espacios)
// Treble: F5 at adjustedIndex=0, descending diatonically
const TREBLE_FREQS: Record<number, number> = {
  [-6]: 1174.66, // D6
  [-5]: 1046.50, // C6
  [-4]:  987.77, // B5
  [-3]:  880.00, // A5
  [-2]:  783.99, // G5
  [-1]:  698.46, // F5
   [0]:  698.46, // F5
   [1]:  659.25, // E5
   [2]:  587.33, // D5
   [3]:  523.25, // C5
   [4]:  493.88, // B4
   [5]:  440.00, // A4
   [6]:  392.00, // G4
   [7]:  349.23, // F4
   [8]:  329.63, // E4
   [9]:  293.66, // D4
  [10]:  261.63, // C4
  [11]:  246.94, // B3
};

// Bass: A3 at adjustedIndex=0, descending diatonically
const BASS_FREQS: Record<number, number> = {
  [-3]:  293.66, // D4
  [-2]:  261.63, // C4
  [-1]:  246.94, // B3
   [0]:  220.00, // A3
   [1]:  196.00, // G3
   [2]:  174.61, // F3
   [3]:  164.81, // E3
   [4]:  146.83, // D3
   [5]:  130.81, // C3
   [6]:  123.47, // B2
   [7]:  110.00, // A2
   [8]:   98.00, // G2
   [9]:   87.31, // F2
  [10]:   82.41, // E2
  [11]:   73.42, // D2
};

export function playNoteFrequency(staffIndex: number, espacios: number, clef: 'treble' | 'bass') {
  const table = clef === 'treble' ? TREBLE_FREQS : BASS_FREQS;
  const freq = table[staffIndex - espacios];
  if (!freq) return;
  playTone(freq, 0.5, 'sine', 0.25);
}

export function scheduleMetronomeClick(atTime: number, isDownbeat: boolean): void {
  const c = getCtx();
  const bufferSize = Math.floor(c.sampleRate * 0.04);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
  }
  const source = c.createBufferSource();
  source.buffer = buffer;
  const gain = c.createGain();
  gain.gain.setValueAtTime(isDownbeat ? 0.45 : 0.22, atTime);
  source.connect(gain);
  gain.connect(c.destination);
  source.start(atTime);
}

export function playBpmIncrease(): void {
  const c = getCtx();
  [880, 1108].forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = 'triangle';
    const t = c.currentTime + i * 0.09;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.start(t);
    osc.stop(t + 0.08);
  });
}

export function playGameOver() {
  const c = getCtx();
  [440, 349, 293].forEach((f, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.frequency.setValueAtTime(f, c.currentTime + i * 0.18);
    gain.gain.setValueAtTime(0.2, c.currentTime + i * 0.18);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.18 + 0.3);
    osc.start(c.currentTime + i * 0.18);
    osc.stop(c.currentTime + i * 0.18 + 0.3);
  });
}
