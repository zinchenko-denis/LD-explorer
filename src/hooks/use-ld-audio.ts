import * as Tone from 'tone';

// 12 particles → C-major pentatonic over 2+ octaves (always consonant)
// Ordered by mass: lightest → lowest note
// Pentatonic: C D E G A, repeating in higher octaves
// Face structure preserved: quarks spread wide, leptons clustered, bosons high
const PARTICLE_NOTES: Record<string, string> = {
  'e':  'C3',   // electron — root (lightest fermion)
  'u':  'D3',   // up quark
  'd':  'E3',   // down quark
  'μ':  'G3',   // muon
  's':  'A3',   // strange
  'p':  'C4',   // proton — ANCHOR = octave of root
  'c':  'D4',   // charm
  'τ':  'E4',   // tau
  'b':  'G4',   // bottom
  'W':  'A4',   // W boson
  'H':  'C5',   // Higgs
  't':  'D5',   // top quark — highest
};

// Face groups for musical structure
const FACES = {
  quarks:  ['u', 'd', 'c', 's', 't', 'b'],
  leptons: ['e', 'μ', 'τ'],
  bosons:  ['W', 'H'],
  anchor:  ['p'],
};

// Arpeggiation patterns (indices into face arrays)
const PATTERNS = [
  // Pattern 1: ascending quarks by generation
  ['u', 'd', 'c', 's', 'b', 't'],
  // Pattern 2: leptons + anchor
  ['e', 'p', 'μ', 'τ'],
  // Pattern 3: bosons + high quarks
  ['b', 'W', 'H', 't'],
  // Pattern 4: full descending
  ['t', 'H', 'W', 'b', 'τ', 'c', 's', 'μ', 'p', 'd', 'u', 'e'],
  // Pattern 5: golden — φ-zero set {p,c,u,t} as chord, then complement
  ['p', 'c', 'u', 't'],
];

let synth: Tone.PolySynth | null = null;
let pad: Tone.PolySynth | null = null;
let reverb: Tone.Reverb | null = null;
let delay: Tone.FeedbackDelay | null = null;
let isPlaying = false;
let timeoutIds: ReturnType<typeof setTimeout>[] = [];
let patternIdx = 0;
let cycleTimeout: ReturnType<typeof setTimeout> | null = null;

function playPattern(pattern: string[]) {
  if (!synth || !isPlaying) return;

  pattern.forEach((name, i) => {
    const note = PARTICLE_NOTES[name];
    if (!note) return;
    const tid = setTimeout(() => {
      if (!synth || !isPlaying) return;
      synth.triggerAttackRelease(note, '2n', undefined, 0.3 + Math.random() * 0.15);
    }, i * 1200);
    timeoutIds.push(tid);
  });

  // Schedule next pattern
  const nextDelay = pattern.length * 1200 + 3000;
  cycleTimeout = setTimeout(() => {
    if (!isPlaying) return;
    patternIdx = (patternIdx + 1) % PATTERNS.length;
    playPattern(PATTERNS[patternIdx]);
  }, nextDelay);
}

export async function startLDAudio() {
  if (isPlaying) return;

  await Tone.start();

  // Effects chain
  reverb = new Tone.Reverb({ decay: 10, wet: 0.6 }).toDestination();
  delay = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: 0.2, wet: 0.25 }).connect(reverb);

  // Lead synth: soft triangle, slow attack
  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle4' },
    envelope: {
      attack: 1.5,
      decay: 1,
      sustain: 0.4,
      release: 4,
    },
    volume: -20,
  }).connect(delay);

  // Pad drone: root + octave (anchor connection)
  pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: {
      attack: 4,
      decay: 2,
      sustain: 0.6,
      release: 8,
    },
    volume: -28,
  }).connect(reverb);

  isPlaying = true;

  // Start with drone: root C3 + anchor C4 (octave = proton/electron)
  pad.triggerAttackRelease('C3', '4m');
  pad.triggerAttackRelease('C4', '4m');

  // Refresh drone every 30s
  const droneRefresh = () => {
    if (!pad || !isPlaying) return;
    pad.triggerAttackRelease('C3', '4m');
    pad.triggerAttackRelease('C4', '4m');
    const tid = setTimeout(droneRefresh, 30000);
    timeoutIds.push(tid);
  };
  const droneTid = setTimeout(droneRefresh, 30000);
  timeoutIds.push(droneTid);

  // Begin first pattern after short intro
  const startTid = setTimeout(() => {
    patternIdx = 0;
    playPattern(PATTERNS[0]);
  }, 2000);
  timeoutIds.push(startTid);
}

export function stopLDAudio() {
  isPlaying = false;
  timeoutIds.forEach(clearTimeout);
  timeoutIds = [];
  if (cycleTimeout) { clearTimeout(cycleTimeout); cycleTimeout = null; }

  if (synth) { synth.releaseAll(); }
  if (pad) { pad.releaseAll(); }

  setTimeout(() => {
    synth?.dispose(); synth = null;
    pad?.dispose(); pad = null;
    delay?.dispose(); delay = null;
    reverb?.dispose(); reverb = null;
  }, 3000);
}

export function isLDAudioPlaying() {
  return isPlaying;
}
