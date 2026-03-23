import * as Tone from 'tone';

// Map 12 particle masses to musical frequencies via log scale
// Range: C2 (65 Hz) to C6 (1047 Hz) — 4 octaves
const PARTICLE_MASSES = [
  { name: 'e',  mass: 0.511 },
  { name: 'u',  mass: 2.16 },
  { name: 'd',  mass: 4.67 },
  { name: 'μ',  mass: 105.66 },
  { name: 's',  mass: 93.4 },
  { name: 'p',  mass: 938.27 },
  { name: 'c',  mass: 1270 },
  { name: 'τ',  mass: 1776.86 },
  { name: 'b',  mass: 4180 },
  { name: 'W',  mass: 80377 },
  { name: 'H',  mass: 125100 },
  { name: 't',  mass: 172690 },
];

const LOG_MIN = Math.log10(0.511);
const LOG_MAX = Math.log10(172690);
const FREQ_MIN = 65;   // C2
const OCTAVES = 4;

function massToFreq(mass: number): number {
  const logMass = Math.log10(mass);
  const t = (logMass - LOG_MIN) / (LOG_MAX - LOG_MIN);
  return FREQ_MIN * Math.pow(2, OCTAVES * t);
}

const FREQUENCIES = PARTICLE_MASSES.map(p => ({
  name: p.name,
  freq: massToFreq(p.mass),
}));

let synth: Tone.PolySynth | null = null;
let reverb: Tone.Reverb | null = null;
let isPlaying = false;
let intervalId: ReturnType<typeof setInterval> | null = null;

export async function startLDAudio() {
  if (isPlaying) return;
  
  await Tone.start();
  
  reverb = new Tone.Reverb({ decay: 8, wet: 0.7 }).toDestination();
  
  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: {
      attack: 3,
      decay: 2,
      sustain: 0.3,
      release: 5,
    },
    volume: -18,
  }).connect(reverb);

  isPlaying = true;

  // Play initial chord: quarks (6 notes, quiet)
  const quarks = FREQUENCIES.filter(f => 
    ['u','d','c','s','t','b'].includes(f.name)
  );
  quarks.forEach((f, i) => {
    setTimeout(() => {
      synth?.triggerAttackRelease(f.freq, '8n');
    }, i * 800);
  });

  // Staggered ambient: cycle through all 12 particles
  let noteIdx = 0;
  intervalId = setInterval(() => {
    if (!synth || !isPlaying) return;
    const f = FREQUENCIES[noteIdx % FREQUENCIES.length];
    synth.triggerAttackRelease(f.freq, '4n');
    noteIdx++;
  }, 3000);
}

export function stopLDAudio() {
  isPlaying = false;
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (synth) {
    synth.releaseAll();
    setTimeout(() => {
      synth?.dispose();
      reverb?.dispose();
      synth = null;
      reverb = null;
    }, 2000);
  }
}

export function isLDAudioPlaying() {
  return isPlaying;
}
