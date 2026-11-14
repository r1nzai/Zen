import { applyGraphicsMode, detectGraphicsMode, resetGraphicsMode } from './graphics';

/** A fake WebGL context reporting `renderer`. */
function fakeGL(renderer: string) {
    return {
        RENDERER: 0x1f01,
        getExtension: (name: string) =>
            name === 'WEBGL_debug_renderer_info' ? { UNMASKED_RENDERER_WEBGL: 0x9246 } : { loseContext: () => {} },
        getParameter: () => renderer,
    };
}

describe('graphics mode', () => {
    const root = document.documentElement;
    let getContext: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        root.removeAttribute('data-zen-graphics');
        resetGraphicsMode();
        getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
    });
    afterEach(() => {
        getContext.mockRestore();
        root.setAttribute('data-zen-graphics', 'full');
    });

    it('is lite when WebGL would run in software (no context with failIfMajorPerformanceCaveat)', () => {
        getContext.mockReturnValue(null);
        expect(detectGraphicsMode()).toBe('lite');
        expect(getContext).toHaveBeenCalledWith('webgl', { failIfMajorPerformanceCaveat: true });
    });

    it.each(['Google SwiftShader', 'llvmpipe (LLVM 17.0.6, 256 bits)', 'Microsoft Basic Render Driver'])(
        'is lite on the software renderer %s',
        (renderer) => {
            getContext.mockReturnValue(fakeGL(renderer) as never);
            expect(detectGraphicsMode()).toBe('lite');
        },
    );

    it('is full on a real GPU', () => {
        getContext.mockReturnValue(fakeGL('ANGLE (NVIDIA GeForce RTX 4070 Direct3D11)') as never);
        expect(detectGraphicsMode()).toBe('full');
    });

    it('marks <html>, once', () => {
        getContext.mockReturnValue(null);
        expect(applyGraphicsMode()).toBe('lite');
        expect(root).toHaveAttribute('data-zen-graphics', 'lite');
        const calls = getContext.mock.calls.length;
        applyGraphicsMode();
        expect(getContext).toHaveBeenCalledTimes(calls); // cached: no second detection
    });

    it('keeps a mode the app set itself', () => {
        root.setAttribute('data-zen-graphics', 'lite');
        getContext.mockReturnValue(fakeGL('NVIDIA') as never);
        expect(applyGraphicsMode()).toBe('lite');
        expect(getContext).not.toHaveBeenCalled();
    });
});
