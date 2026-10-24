import { useSyncExternalStore } from 'react';

// The examples' tracks: chords and an arpeggio, synthesized in the browser so
// the docs need no audio files. Your player takes any `src` instead.

const RATE = 22050;

export interface DemoTrack {
    /** MIDI notes, three to a chord. */
    chords: number[][];
    chordSeconds: number;
    /** Times through the chords. */
    rounds: number;
}

export const GLASS_AURORA: DemoTrack = {
    chords: [
        [57, 60, 64], // A minor
        [53, 57, 60], // F
        [48, 52, 55], // C
        [55, 59, 62], // G
    ],
    chordSeconds: 2.5,
    rounds: 2,
};

export const demoTrackSeconds = (track: DemoTrack) => track.chordSeconds * track.chords.length * track.rounds;

const hz = (note: number) => 440 * 2 ** ((note - 69) / 12);

function synthesize({ chords, chordSeconds }: DemoTrack, seconds: number) {
    const length = Math.round(RATE * seconds);
    const samples = new Float32Array(length);
    const chordLength = RATE * chordSeconds;
    const beat = chordSeconds / 8;
    for (let i = 0; i < length; i++) {
        const chord = chords[Math.floor(i / chordLength) % chords.length];
        const t = i / RATE;
        const inChord = (i % chordLength) / RATE;
        // A soft pad, swelling in and out with each chord.
        const swell = Math.min(inChord / 0.4, 1) * Math.min((chordSeconds - inChord) / 0.6, 1);
        let pad = 0;
        for (const note of chord)
            pad += Math.sin(2 * Math.PI * hz(note) * t) + 0.5 * Math.sin(2 * Math.PI * hz(note) * 1.003 * t);
        // An arpeggio over it, an octave up: eighth notes that ring and fade.
        const step = Math.floor(inChord / beat);
        const sinceStep = inChord - step * beat;
        const pluck = Math.sin(2 * Math.PI * hz(chord[step % 3] + 12) * t) * Math.exp(-sinceStep * 6);
        samples[i] = 0.09 * swell * pad + 0.2 * pluck;
    }
    return samples;
}

function wav(samples: Float32Array) {
    const view = new DataView(new ArrayBuffer(44 + samples.length * 2));
    const text = (at: number, s: string) => {
        for (let i = 0; i < s.length; i++) view.setUint8(at + i, s.charCodeAt(i));
    };
    text(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    text(8, 'WAVEfmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, RATE, true);
    view.setUint32(28, RATE * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    text(36, 'data');
    view.setUint32(40, samples.length * 2, true);
    samples.forEach((s, i) => view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s)) * 0x7fff, true));
    return new Blob([view], { type: 'audio/wav' });
}

const urls = new Map<DemoTrack, string>();
function demoTrackUrl(track: DemoTrack) {
    let url = urls.get(track);
    if (!url) {
        url = URL.createObjectURL(wav(synthesize(track, demoTrackSeconds(track))));
        urls.set(track, url);
    }
    return url;
}
const subscribe = () => () => {};

/** A demo track's URL, once in the browser. */
export function useDemoTrack(track = GLASS_AURORA): string | undefined {
    return useSyncExternalStore(
        subscribe,
        () => demoTrackUrl(track),
        () => undefined,
    );
}
