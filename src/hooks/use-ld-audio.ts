import * as Tone from 'tone';

// === 12 PARTICLES → 12 CHROMATIC NOTES (by mass) ===
export const PARTICLE_NOTE_MAP = [
  { particle: 'e',  note: 'C#', type: 'lep' },
  { particle: 'u',  note: 'D',  type: 'qup' },
  { particle: 'd',  note: 'D#', type: 'qdn' },
  { particle: 's',  note: 'E',  type: 'qdn' },
  { particle: 'μ',  note: 'F',  type: 'lep' },
  { particle: 'p',  note: 'F#', type: 'anc' },
  { particle: 'c',  note: 'G',  type: 'qup' },
  { particle: 'τ',  note: 'G#', type: 'lep' },
  { particle: 'b',  note: 'A',  type: 'qdn' },
  { particle: 'W',  note: 'A#', type: 'bos' },
  { particle: 'H',  note: 'B',  type: 'bos' },
  { particle: 't',  note: 'C',  type: 'qup' },
];

function noteToParticle(n: string): string {
  const base = n.replace(/[0-9]/g, '');
  return PARTICLE_NOTE_MAP.find(m => m.note === base)?.particle || '?';
}

function noteFreq(name: string): number {
  const notes: Record<string,number> = {'C':0,'C#':1,'D':2,'D#':3,'E':4,'F':5,'F#':6,'G':7,'G#':8,'A':9,'A#':10,'B':11};
  const match = name.match(/^([A-G]#?)(\d)$/);
  if (!match) return 440;
  return 440 * Math.pow(2, (notes[match[1]] - 9 + (parseInt(match[2]) - 4) * 12) / 12);
}

// Score event
interface ScoreEvent {
  time: number; // in beats
  note: string;
  dur: number;
  hand: 'RH' | 'LH';
  bar: number;
}

function buildScore(): ScoreEvent[] {
  const s: ScoreEvent[] = [];
  
  function tri(start: number, notes: string[], beats: number, bar: number) {
    for (let b = 0; b < beats; b++)
      for (let i = 0; i < 3; i++)
        s.push({ time: start + b + i/3, note: notes[i], dur: 0.3, hand: 'RH', bar });
  }
  function bass(start: number, notes: string[], dur: number, bar: number) {
    notes.forEach(n => s.push({ time: start, note: n, dur, hand: 'LH', bar }));
  }

  // Bars 1-2: G#3-C#4-E4 over C#2
  bass(0, ['G#2','C#3'], 8, 1);
  tri(0, ['G#3','C#4','E4'], 8, 1);
  
  // Bar 3: A3-C#4-E4
  bass(8, ['A2','C#3'], 4, 3);
  tri(8, ['A3','C#4','E4'], 4, 3);
  
  // Bar 4: D4-F#4-A3
  bass(12, ['D2','A2'], 4, 4);
  tri(12, ['A3','D4','F#4'], 4, 4);
  
  // Bar 5: G#3-B3-E4
  bass(16, ['E2','B2'], 4, 5);
  tri(16, ['G#3','B3','E4'], 4, 5);
  
  // Bar 6: G#3-C#4-E4
  bass(20, ['C#2','G#2'], 4, 6);
  tri(20, ['G#3','C#4','E4'], 4, 6);
  
  // Bar 7: A3-C#4-E4
  bass(24, ['A1','A2'], 4, 7);
  tri(24, ['A3','C#4','E4'], 4, 7);
  
  // Bar 8: F#3-A3-D#4
  bass(28, ['F#2','C#3'], 4, 8);
  tri(28, ['F#3','A3','D#4'], 4, 8);
  
  // Bar 9: G#3-B3-E4
  bass(32, ['G#2','B2'], 4, 9);
  tri(32, ['G#3','B3','E4'], 4, 9);
  
  // Bar 10-11: C#3-E3-G#3 — melody G#4 emerges
  bass(36, ['C#2','C#3'], 4, 10);
  tri(36, ['C#3','E3','G#3'], 4, 10);
  s.push({ time: 36, note: 'G#4', dur: 4, hand: 'RH', bar: 10 });
  
  bass(40, ['B1','B2'], 4, 11);
  tri(40, ['D3','F#3','B3'], 4, 11);
  s.push({ time: 40, note: 'F#4', dur: 4, hand: 'RH', bar: 11 });
  
  // Bar 12: E-G#-C# melody E4
  bass(44, ['A1','A2'], 4, 12);
  tri(44, ['C#3','E3','A3'], 4, 12);
  s.push({ time: 44, note: 'E4', dur: 4, hand: 'RH', bar: 12 });
  
  // Bar 13-14: chromatic melody descent
  bass(48, ['D2','D3'], 4, 13);
  tri(48, ['A3','D4','F#4'], 4, 13);
  s.push({ time: 48, note: 'F#4', dur: 2, hand: 'RH', bar: 13 });
  s.push({ time: 50, note: 'E4', dur: 2, hand: 'RH', bar: 13 });
  
  bass(52, ['G#2','E3'], 4, 14);
  tri(52, ['G#3','B3','E4'], 4, 14);
  s.push({ time: 52, note: 'D#4', dur: 4, hand: 'RH', bar: 14 });
  
  // Bar 15-16: resolve to C# minor
  bass(56, ['C#2','G#2','C#3'], 4, 15);
  tri(56, ['G#3','C#4','E4'], 4, 15);
  s.push({ time: 56, note: 'C#4', dur: 4, hand: 'RH', bar: 15 });
  
  bass(60, ['F#2','A2','C#3'], 4, 16);
  tri(60, ['A3','C#4','F#4'], 4, 16);
  
  // Bar 17-18: new phrase — higher register
  bass(64, ['G#2','B2','E3'], 4, 17);
  tri(64, ['B3','E4','G#4'], 4, 17);
  
  bass(68, ['A2','C#3','E3'], 4, 18);
  tri(68, ['A3','C#4','E4'], 4, 18);
  s.push({ time: 68, note: 'A4', dur: 2, hand: 'RH', bar: 18 });
  s.push({ time: 70, note: 'G#4', dur: 2, hand: 'RH', bar: 18 });
  
  // Bar 19-20: B section echo  
  bass(72, ['D2','F#2','A2'], 4, 19);
  tri(72, ['A3','D4','F#4'], 4, 19);
  s.push({ time: 72, note: 'F#4', dur: 4, hand: 'RH', bar: 19 });
  
  bass(76, ['E2','G#2','B2'], 4, 20);
  tri(76, ['G#3','B3','E4'], 4, 20);
  s.push({ time: 76, note: 'E4', dur: 2, hand: 'RH', bar: 20 });
  s.push({ time: 78, note: 'D#4', dur: 2, hand: 'RH', bar: 20 });
  
  // Bar 21-22: final phrase before repeat
  bass(80, ['C#2','E2','G#2'], 4, 21);
  tri(80, ['G#3','C#4','E4'], 4, 21);
  s.push({ time: 80, note: 'C#4', dur: 4, hand: 'RH', bar: 21 });
  
  bass(84, ['G#1','D#2','G#2'], 4, 22);
  tri(84, ['G#3','B3','E4'], 3, 22);
  tri(87, ['G#3','C#4','E4'], 1, 22);

  return s.sort((a, b) => a.time - b.time);
}

// Callback for UI highlight
type NoteCallback = (particle: string) => void;
let noteCallback: NoteCallback | null = null;

let rhSynth: Tone.PolySynth | null = null;
let lhSynth: Tone.PolySynth | null = null;
let reverb: Tone.Reverb | null = null;
let isPlaying = false;
let timeoutIds: ReturnType<typeof setTimeout>[] = [];

export function onNotePlay(cb: NoteCallback) { noteCallback = cb; }

export async function startLDAudio() {
  if (isPlaying) return;
  await Tone.start();

  reverb = new Tone.Reverb({ decay: 8, wet: 0.55 }).toDestination();
  
  rhSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.08, decay: 1.5, sustain: 0.15, release: 3 },
    volume: -16,
  }).connect(reverb);

  lhSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle2' },
    envelope: { attack: 0.3, decay: 2, sustain: 0.4, release: 5 },
    volume: -22,
  }).connect(reverb);

  isPlaying = true;
  playLoop();
}

function playLoop() {
  if (!isPlaying) return;
  const score = buildScore();
  const beatDur = 60 / 48; // tempo 48 BPM

  score.forEach(ev => {
    const tid = setTimeout(() => {
      if (!isPlaying || !rhSynth || !lhSynth) return;
      const syn = ev.hand === 'LH' ? lhSynth : rhSynth;
      syn.triggerAttackRelease(noteFreq(ev.note), ev.dur * beatDur);
      
      if (ev.hand === 'RH') {
        const p = noteToParticle(ev.note);
        noteCallback?.(p);
      }
    }, ev.time * beatDur * 1000);
    timeoutIds.push(tid);
  });

  // Loop after score ends (last event ~88 beats + 4 beats pause)
  const totalBeats = 92;
  const loopTid = setTimeout(() => {
    if (isPlaying) playLoop();
  }, totalBeats * beatDur * 1000);
  timeoutIds.push(loopTid);
}

export function stopLDAudio() {
  isPlaying = false;
  timeoutIds.forEach(clearTimeout);
  timeoutIds = [];
  rhSynth?.releaseAll();
  lhSynth?.releaseAll();
  setTimeout(() => {
    rhSynth?.dispose(); rhSynth = null;
    lhSynth?.dispose(); lhSynth = null;
    reverb?.dispose(); reverb = null;
  }, 3000);
}

export function isLDAudioPlaying() { return isPlaying; }
