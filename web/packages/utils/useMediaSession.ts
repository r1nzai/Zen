import { useEffect, useLayoutEffect, useRef } from 'react';

import type { MediaPlayer } from './useMediaPlayer';

export interface MediaSessionOptions {
    title?: string;
    artist?: string;
    album?: string;
    /** Cover art, e.g. `[{ src: '/cover-512.jpg', sizes: '512x512', type: 'image/jpeg' }]`. */
    artwork?: MediaImage[];
    /** Shows a previous button on the lock screen and makes the key work. */
    onPrevious?: () => void;
    /** Shows a next button on the lock screen and makes the key work. */
    onNext?: () => void;
    /** Seconds the skip back and forward buttons move (default 10). */
    seekOffset?: number;
}

/** What useMediaSession needs from a player: useMediaPlayer's, or your own. */
export type MediaSessionPlayer = Pick<
    MediaPlayer,
    'playing' | 'currentTime' | 'duration' | 'playbackRate' | 'play' | 'pause' | 'seek'
>;

/**
 * Puts what's playing on the lock screen, the notification shade and the OS
 * media controls (title, artist, cover, position), and makes play, pause,
 * seek, previous, next and the keyboard's media keys control your player.
 * Does nothing where the browser has no Media Session API.
 */
export function useMediaSession(player: MediaSessionPlayer, options: MediaSessionOptions = {}) {
    const { title, artist, album, artwork, onPrevious, onNext } = options;
    const latest = useRef({ player, options });
    useLayoutEffect(() => {
        latest.current = { player, options };
    });
    const supported = typeof navigator !== 'undefined' && 'mediaSession' in navigator;

    const art = JSON.stringify(artwork ?? []);
    useEffect(() => {
        if (!supported) return;
        navigator.mediaSession.metadata = new MediaMetadata({ title, artist, album, artwork: JSON.parse(art) });
        return () => {
            navigator.mediaSession.metadata = null;
        };
    }, [supported, title, artist, album, art]);

    useEffect(() => {
        if (!supported) return;
        navigator.mediaSession.playbackState = player.playing ? 'playing' : 'paused';
    }, [supported, player.playing]);

    const { duration, currentTime, playbackRate } = player;
    useEffect(() => {
        if (!supported) return;
        try {
            if (duration > 0)
                navigator.mediaSession.setPositionState({
                    duration,
                    position: Math.min(currentTime, duration),
                    playbackRate: playbackRate || 1,
                });
            else navigator.mediaSession.setPositionState();
        } catch {
            // Browsers that can't show a position.
        }
    }, [supported, duration, currentTime, playbackRate]);

    const hasPrevious = !!onPrevious;
    const hasNext = !!onNext;
    useEffect(() => {
        if (!supported) return;
        const offset = () => latest.current.options.seekOffset ?? 10;
        const now = () => latest.current.player;
        const handlers: [MediaSessionAction, MediaSessionActionHandler | null][] = [
            [
                'play',
                () =>
                    void now()
                        .play()
                        .catch(() => {}),
            ],
            ['pause', () => now().pause()],
            ['seekto', (d) => d.seekTime != null && now().seek(d.seekTime)],
            ['seekbackward', (d) => now().seek(now().currentTime - (d.seekOffset ?? offset()))],
            ['seekforward', (d) => now().seek(now().currentTime + (d.seekOffset ?? offset()))],
            ['previoustrack', hasPrevious ? () => latest.current.options.onPrevious?.() : null],
            ['nexttrack', hasNext ? () => latest.current.options.onNext?.() : null],
        ];
        const set = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
            try {
                navigator.mediaSession.setActionHandler(action, handler);
            } catch {
                // An action this browser doesn't know.
            }
        };
        for (const [action, handler] of handlers) set(action, handler);
        return () => {
            for (const [action] of handlers) set(action, null);
        };
    }, [supported, hasPrevious, hasNext]);
}
