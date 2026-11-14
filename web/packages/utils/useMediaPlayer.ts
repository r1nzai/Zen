import { RefCallback, useCallback, useMemo, useRef, useState } from 'react';

export interface MediaState {
    /** Playing, or about to (not paused). */
    playing: boolean;
    /** Playing but stalled, waiting for data. */
    waiting: boolean;
    ended: boolean;
    /** Seconds in. */
    currentTime: number;
    /** Seconds long; 0 until known, and for a live stream. */
    duration: number;
    /** Seconds loaded from the start of the stretch being played: how far it can play without waiting. */
    buffered: number;
    /** 0 to 1. */
    volume: number;
    muted: boolean;
    playbackRate: number;
    error: MediaError | null;
}

export interface MediaPlayer extends MediaState {
    /** Rejects when the browser won't play yet (autoplay before any tap) or can't play the source. */
    play: () => Promise<void>;
    pause: () => void;
    toggle: () => Promise<void>;
    /** Jump to a time, in seconds. */
    seek: (time: number) => void;
    setVolume: (volume: number) => void;
    setMuted: (muted: boolean) => void;
}

const EVENTS = [
    'play',
    'pause',
    'playing',
    'waiting',
    'ended',
    'timeupdate',
    'durationchange',
    'loadedmetadata',
    'progress',
    'seeking',
    'volumechange',
    'ratechange',
    'emptied',
    'error',
] as const;

const INITIAL: MediaState = {
    playing: false,
    waiting: false,
    ended: false,
    currentTime: 0,
    duration: 0,
    buffered: 0,
    volume: 1,
    muted: false,
    playbackRate: 1,
    error: null,
};

function read(el: HTMLMediaElement): MediaState {
    const time = el.currentTime;
    let buffered = 0;
    for (let i = 0; i < el.buffered.length; i++) {
        if (el.buffered.start(i) <= time && time <= el.buffered.end(i)) buffered = el.buffered.end(i);
    }
    return {
        playing: !el.paused,
        waiting: !el.paused && el.readyState < HTMLMediaElement.HAVE_FUTURE_DATA,
        ended: el.ended,
        currentTime: time,
        duration: Number.isFinite(el.duration) ? el.duration : 0,
        buffered,
        volume: el.volume,
        muted: el.muted,
        playbackRate: el.playbackRate,
        error: el.error,
    };
}

const same = (a: MediaState, b: MediaState) =>
    (Object.keys(a) as (keyof MediaState)[]).every((key) => Object.is(a[key], b[key]));

/**
 * Plays audio or video through your own <audio> or <video> element, and keeps
 * its state for the UI: playing, time, duration, buffered, volume. Returns the
 * ref for the element, kept apart from the player so reading the player isn't
 * reading a ref: `const [ref, player] = useMediaPlayer(); <audio ref={ref} />`.
 * Pair it with SeekBar, and with useMediaSession for the lock screen and media keys.
 */
export function useMediaPlayer(): [ref: RefCallback<HTMLMediaElement>, player: MediaPlayer] {
    const [state, setState] = useState(INITIAL);
    const element = useRef<HTMLMediaElement | null>(null);

    const ref = useCallback<RefCallback<HTMLMediaElement>>((el) => {
        if (!el) return;
        element.current = el;
        const update = () => setState((prev) => (same(prev, read(el)) ? prev : read(el)));
        update();
        for (const type of EVENTS) el.addEventListener(type, update);
        return () => {
            for (const type of EVENTS) el.removeEventListener(type, update);
            if (element.current === el) element.current = null;
        };
    }, []);

    const controls = useMemo(() => {
        const play = async () => {
            try {
                await element.current?.play();
            } catch (error) {
                // A pause() before playback starts interrupts play(): that's the pause working.
                if (!(error instanceof DOMException && error.name === 'AbortError')) throw error;
            }
        };
        const pause = () => element.current?.pause();
        return {
            play,
            pause,
            toggle: () => (element.current?.paused === false ? Promise.resolve(pause()) : play()),
            seek: (time: number) => {
                const el = element.current;
                if (!el) return;
                const end = Number.isFinite(el.duration) ? el.duration : Infinity;
                el.currentTime = Math.min(Math.max(time, 0), end);
            },
            setVolume: (volume: number) => {
                if (element.current) element.current.volume = Math.min(Math.max(volume, 0), 1);
            },
            setMuted: (muted: boolean) => {
                if (element.current) element.current.muted = muted;
            },
        };
    }, []);

    return [ref, { ...state, ...controls }];
}
