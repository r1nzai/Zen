import { act, renderHook } from '@testing-library/react';

import { useMediaPlayer } from './useMediaPlayer';

/** An <audio> whose state the test sets, as jsdom plays nothing. */
function fake(el: HTMLAudioElement, state: { paused?: boolean; currentTime?: number; duration?: number }) {
    const s = { paused: true, currentTime: 0, duration: NaN, ...state };
    Object.defineProperties(el, {
        paused: { get: () => s.paused, configurable: true },
        currentTime: { get: () => s.currentTime, set: (t: number) => void (s.currentTime = t), configurable: true },
        duration: { get: () => s.duration, configurable: true },
        readyState: { get: () => HTMLMediaElement.HAVE_ENOUGH_DATA, configurable: true },
        buffered: {
            get: () => ({ length: 1, start: () => 0, end: () => Math.min(90, s.duration || 0) }),
            configurable: true,
        },
    });
    return s;
}

/** The hook, on an <audio> of its own. */
function setup() {
    const hook = renderHook(() => useMediaPlayer());
    const el = document.createElement('audio');
    act(() => void hook.result.current[0](el));
    return { el, player: () => hook.result.current[1] };
}

describe('useMediaPlayer', () => {
    it("keeps the element's state, from its events", () => {
        const { el, player } = setup();
        const state = fake(el, { duration: 187 });
        act(() => void el.dispatchEvent(new Event('durationchange')));
        expect(player()).toMatchObject({ playing: false, duration: 187, buffered: 90 });
        state.paused = false;
        state.currentTime = 42;
        act(() => void el.dispatchEvent(new Event('timeupdate')));
        expect(player()).toMatchObject({ playing: true, currentTime: 42 });
    });

    it('seeks within the track, and reads a live stream as no length', () => {
        const { el, player } = setup();
        const state = fake(el, { duration: 187 });
        act(() => player().seek(500));
        expect(state.currentTime).toBe(187);
        act(() => player().seek(-5));
        expect(state.currentTime).toBe(0);
        state.duration = Infinity;
        act(() => void el.dispatchEvent(new Event('durationchange')));
        expect(player().duration).toBe(0);
    });

    it('lets a pause interrupt play, and passes on other failures', async () => {
        const { el, player } = setup();
        el.play = () => Promise.reject(new DOMException('interrupted', 'AbortError'));
        await expect(player().play()).resolves.toBeUndefined();
        el.play = () => Promise.reject(new DOMException('no gesture', 'NotAllowedError'));
        await expect(player().play()).rejects.toThrow('no gesture');
    });
});
