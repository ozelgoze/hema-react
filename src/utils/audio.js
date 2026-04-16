let audioCtx = null;

function getContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Global mute toggle
let isMuted = false;

export const setMuted = (muted) => {
  isMuted = muted;
};

export const getMuted = () => isMuted;

// 1. Sword Clash (Used when adding a node)
export function playClash() {
  if (isMuted) return;
  const ctx = getContext();
  const time = ctx.currentTime;

  // Metallic ring
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(800, time);
  osc.frequency.exponentialRampToValueAtTime(1200, time + 0.1);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.3, time + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(time);
  osc.stop(time + 0.4);

  // High pitch scrape
  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(3000, time);
  osc2.frequency.exponentialRampToValueAtTime(8000, time + 0.2);

  const gain2 = ctx.createGain();
  gain2.gain.setValueAtTime(0, time);
  gain2.gain.linearRampToValueAtTime(0.1, time + 0.02);
  gain2.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  
  osc2.start(time);
  osc2.stop(time + 0.2);
}

// 2. Win Gong (Used when scoring a finisher)
export function playWin() {
  if (isMuted) return;
  const ctx = getContext();
  const time = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(50, time + 2);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.5, time + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 2);

  // Enhance with harmonics
  const osc2 = ctx.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(300, time);
  osc2.frequency.exponentialRampToValueAtTime(100, time + 1.5);
  
  const gain2 = ctx.createGain();
  gain2.gain.setValueAtTime(0, time);
  gain2.gain.linearRampToValueAtTime(0.2, time + 0.1);
  gain2.gain.exponentialRampToValueAtTime(0.01, time + 1.5);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);

  osc.start(time);
  osc.stop(time + 2);
  osc2.start(time);
  osc2.stop(time + 1.5);
}

// 3. Loss Thud (Used when AI scores)
export function playLoss() {
  if (isMuted) return;
  const ctx = getContext();
  const time = ctx.currentTime;

  // Dark thud
  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(100, time);
  osc.frequency.exponentialRampToValueAtTime(20, time + 0.5);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.6, time + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(time);
  osc.stop(time + 0.5);
}
