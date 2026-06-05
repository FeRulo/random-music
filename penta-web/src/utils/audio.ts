let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
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
