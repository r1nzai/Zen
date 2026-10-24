import { cleanup, render } from '@testing-library/react';

import { MediaSessionOptions, MediaSessionPlayer, useMediaSession } from './useMediaSession';

const handlers = new Map<string, MediaSessionActionHandler | null>();
const session = {
    metadata: null as unknown,
    playbackState: 'none',
    setActionHandler: (action: string, handler: MediaSessionActionHandler | null) => handlers.set(action, handler),
    setPositionState: vi.fn(),
};

beforeEach(() => {
    handlers.clear();
    session.setPositionState.mockClear();
    Object.defineProperty(navigator, 'mediaSession', { value: session, configurable: true });
    vi.stubGlobal(
        'MediaMetadata',
        class {
            constructor(init: object) {
                Object.assign(this, init);
            }
        },
    );
});
afterEach(() => {
    cleanup();
    delete (navigator as { mediaSession?: unknown }).mediaSession;
    vi.unstubAllGlobals();
});

const player = (over: Partial<MediaSessionPlayer> = {}): MediaSessionPlayer => ({
    playing: true,
    currentTime: 42,
    duration: 187,
    playbackRate: 1,
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
    seek: vi.fn(),
    ...over,
});

function Session({ p, options }: { p: MediaSessionPlayer; options?: MediaSessionOptions }) {
    useMediaSession(p, options);
    return null;
}

describe('useMediaSession', () => {
    it("shows what's playing and where", () => {
        render(<Session p={player()} options={{ title: 'Song', artist: 'Band' }} />);
        expect(session.metadata).toMatchObject({ title: 'Song', artist: 'Band' });
        expect(session.playbackState).toBe('playing');
        expect(session.setPositionState).toHaveBeenLastCalledWith({ duration: 187, position: 42, playbackRate: 1 });
    });

    it('controls the player, with previous and next only when given', () => {
        const p = player();
        const onNext = vi.fn();
        const { unmount } = render(<Session p={p} options={{ onNext, seekOffset: 15 }} />);
        handlers.get('pause')!({ action: 'pause' });
        expect(p.pause).toHaveBeenCalled();
        handlers.get('seekto')!({ action: 'seekto', seekTime: 100 });
        expect(p.seek).toHaveBeenCalledWith(100);
        handlers.get('seekforward')!({ action: 'seekforward' });
        expect(p.seek).toHaveBeenLastCalledWith(57);
        handlers.get('nexttrack')!({ action: 'nexttrack' });
        expect(onNext).toHaveBeenCalled();
        expect(handlers.get('previoustrack')).toBeNull();
        unmount();
        expect(handlers.get('play')).toBeNull();
        expect(session.metadata).toBeNull();
    });
});
