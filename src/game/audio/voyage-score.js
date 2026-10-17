/**
 * NEON CRONIUM — original procedural score, composition revision 1.
 * Written for this project: no samples, external music or generated rights claims.
 * One update-driven owner schedules short, finite Web Audio voices. It never
 * requests frames or starts a timer; the existing game loop supplies dt.
 */
export const VOYAGE_SCORE_VERSION = 'chronos-score-v1';
export const SCORE_VOICE_LIMIT = 12;

const note = (beat, midi, length, voice = 'glass', level = .095) =>
  Object.freeze({ beat, midi, length, voice, level });
const phrase = (bpm, beats, notes) => Object.freeze({ bpm, beats,
  notes: Object.freeze([...notes].sort((a, b) => a.beat - b.beat)) });

// Eight bars in D minor: broad bass movement, suspended tones and room between
// the two halves of the melody. This is travel music, not a continuous drone.
const transit = phrase(84, 32, [
  ...[38, 34, 41, 36].flatMap((root, bar) => [
    note(bar * 8, root, 3.5, 'hull', .13),
    note(bar * 8 + 4, root + 12, 2.8, 'hull', .075)
  ]),
  note(0, 62, 2.6, 'air', .055), note(0, 69, 2.6, 'air', .045),
  note(8, 65, 2.6, 'air', .055), note(8, 69, 2.6, 'air', .045),
  note(16, 65, 2.6, 'air', .055), note(16, 72, 2.6, 'air', .045),
  note(24, 64, 2.6, 'air', .055), note(24, 67, 2.6, 'air', .045),
  ...[[1.5, 74], [3, 69], [5.5, 77], [7, 76], [10, 74], [13, 69],
    [17.5, 77], [19, 79], [21.5, 81], [23, 77], [26, 76], [29, 74]]
    .map(([beat, midi]) => note(beat, midi, .85))
]);

// Four bars of a faster, restrained D/E-flat ostinato. The bass and answering
// high phrase change with the territorial guardian rather than random enemies.
const atlas = phrase(120, 16, [
  ...[0, 2, 4, 6, 8, 10, 12, 14].map((beat, index) =>
    note(beat, [38, 38, 41, 39, 38, 45, 39, 45][index], .65, 'hull', .14)),
  ...[0, 1.5, 3, 4, 5.5, 7, 8, 9.5, 11, 12, 13.5, 15].map((beat, index) =>
    note(beat, [62, 69, 65, 63, 69, 65, 62, 72, 69, 63, 69, 74][index], .34, 'pulse', .075)),
  note(2.5, 74, 1, 'glass', .085), note(6.5, 75, 1, 'glass', .085),
  note(10.5, 77, 1, 'glass', .085), note(14.5, 76, .8, 'glass', .085)
]);

// C9's warm F-major answer to the travelling motif; arrival resolves on D.
const station = phrase(76, 16, [
  note(0, 41, 3.5, 'hull', .10), note(4, 48, 2.5, 'hull', .075),
  note(8, 46, 3.5, 'hull', .10), note(12, 48, 2.5, 'hull', .075),
  ...[[0, 65], [0, 69], [8, 62], [8, 69]].map(([beat, midi]) => note(beat, midi, 2.5, 'air', .045)),
  ...[[1, 72], [3, 69], [5, 67], [7, 65], [9, 69], [11, 72], [14, 74]]
    .map(([beat, midi]) => note(beat, midi, 1.1, 'glass', .07))
]);
const arrival = phrase(92, 16, [
  note(0, 38, 3.5, 'hull', .11), note(4, 41, 3.5, 'hull', .11),
  note(8, 36, 3.5, 'hull', .10), note(12, 38, 3.5, 'hull', .11),
  ...[[0, 62], [0, 69], [4, 65], [4, 72], [8, 64], [8, 67], [12, 66], [12, 69]]
    .map(([beat, midi]) => note(beat, midi, 2.8, 'air', .045)),
  ...[[.5, 74], [2, 77], [4.5, 79], [6, 81], [8.5, 79], [10, 76], [12.5, 78], [14, 81]]
    .map(([beat, midi]) => note(beat, midi, 1.15, 'glass', .09))
]);

export const VOYAGE_SCORE_PHRASES = Object.freeze({ transit, atlas, station, arrival });

const safeDisconnect = node => { try { node.disconnect(); } catch { /* already released */ } };

/** Owns at most twelve bounded voices, and no AudioContext of its own. */
export function createVoyageScore({ context, output }) {
  if (!context || !output) throw new TypeError('A shared AudioContext and music output are required');
  const active = new Set();
  let selected = 'transit', beat = 0, cursor = 0, cycles = 0;
  let enabled = true, paused = false, disposed = false, totalVoices = 0;

  function release(record) {
    if (!active.delete(record)) return;
    safeDisconnect(record.oscillator); safeDisconnect(record.gain); safeDisconnect(record.filter);
  }

  function stopVoices() {
    for (const record of [...active]) {
      try { record.oscillator.stop(context.currentTime); } catch { /* already ended */ }
      release(record);
    }
  }

  function play(event, delay) {
    if (active.size >= SCORE_VOICE_LIMIT) return;
    const now = context.currentTime + Math.max(0, delay);
    const seconds = Math.min(4, Math.max(.07, event.length * 60 / VOYAGE_SCORE_PHRASES[selected].bpm));
    const oscillator = context.createOscillator(), gain = context.createGain(), filter = context.createBiquadFilter();
    const hull = event.voice === 'hull', air = event.voice === 'air';
    oscillator.type = hull ? 'triangle' : air ? 'sine' : 'triangle';
    oscillator.frequency.setValueAtTime(440 * 2 ** ((event.midi - 69) / 12), now);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(hull ? 360 : air ? 1400 : event.voice === 'pulse' ? 1700 : 3500, now);
    filter.Q.setValueAtTime(.65, now);
    const attack = Math.min(seconds * .25, air ? .25 : hull ? .035 : .012);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.linearRampToValueAtTime(event.level, now + attack);
    gain.gain.exponentialRampToValueAtTime(.0001, now + seconds);
    oscillator.connect(filter); filter.connect(gain); gain.connect(output);
    const record = { oscillator, gain, filter, end: now + seconds + .015 };
    active.add(record); totalVoices++;
    oscillator.onended = () => release(record);
    oscillator.start(now); oscillator.stop(record.end);
  }

  function advance(seconds) {
    if (disposed || !enabled || paused || context.state !== 'running') return;
    const dt = Number.isFinite(seconds) ? Math.max(0, Math.min(.1, seconds)) : 0;
    if (!dt) return;
    // onended releases nodes in browsers; pruning also bounds a delayed callback.
    for (const record of [...active]) if (record.end <= context.currentTime) release(record);
    const phrase = VOYAGE_SCORE_PHRASES[selected], beatsPerSecond = phrase.bpm / 60;
    const endBeat = beat + dt * beatsPerSecond;
    while (cursor < phrase.notes.length && phrase.notes[cursor].beat <= endBeat) {
      const event = phrase.notes[cursor++];
      play(event, Math.max(0, event.beat - beat) / beatsPerSecond);
    }
    beat = endBeat;
    if (beat >= phrase.beats) {
      beat -= phrase.beats; cursor = 0; cycles++;
    }
  }

  return Object.freeze({
    advance,
    setContext(value) {
      if (disposed || !Object.prototype.hasOwnProperty.call(VOYAGE_SCORE_PHRASES, value) || value === selected) return false;
      stopVoices(); selected = value; beat = 0; cursor = 0; cycles = 0;
      return true;
    },
    setEnabled(value) {
      const next = value === true;
      if (disposed || enabled === next) return;
      enabled = next; if (!enabled) stopVoices();
    },
    setPaused(value) {
      const next = value === true;
      if (disposed || paused === next) return;
      paused = next; if (paused) stopVoices();
    },
    snapshot: () => Object.freeze({ version: VOYAGE_SCORE_VERSION, context: selected,
      beat, cycles, activeVoices: active.size, totalVoices, enabled, paused, disposed }),
    dispose() { if (!disposed) { stopVoices(); disposed = true; } }
  });
}
