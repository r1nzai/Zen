import { themeWave } from './theme-wave';

describe('themeWave', () => {
    let animate: ReturnType<typeof vi.fn<Element['animate']>>;
    let finish: () => void;
    const cancelClip = vi.fn();

    beforeEach(() => {
        animate = vi.fn<Element['animate']>(
            () =>
                ({
                    finished: Promise.resolve(),
                    currentTime: 0,
                    playState: 'running',
                    cancel: cancelClip,
                }) as unknown as Animation,
        );
        Element.prototype.animate = animate;
        vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(0);
        const finished = new Promise<void>((resolve) => (finish = resolve));
        document.startViewTransition = ((update: () => void) => {
            update();
            return { ready: Promise.resolve(), finished, updateCallbackDone: Promise.resolve(), skipTransition() {} };
        }) as typeof document.startViewTransition;
        Object.assign(window, { innerWidth: 1000, innerHeight: 800 });
    });

    afterEach(() => {
        document.documentElement.className = '';
        document.documentElement.removeAttribute('style');
        document.documentElement.removeAttribute('data-zen-graphics');
        vi.restoreAllMocks();
        delete (document as Partial<Document>).startViewTransition;
        delete (Element.prototype as Partial<Element>).animate;
    });

    const settle = async () => {
        finish();
        await new Promise((resolve) => setTimeout(resolve));
    };

    it('just changes the theme without view transitions, or with reduced motion', () => {
        const start = vi.spyOn(document, 'startViewTransition');
        document.documentElement.classList.add('reduce-motion');
        const change = vi.fn();
        themeWave(change);
        delete (document as Partial<Document>).startViewTransition;
        document.documentElement.classList.remove('reduce-motion');
        themeWave(change);
        expect(change).toHaveBeenCalledTimes(2);
        expect(start).not.toHaveBeenCalled();
    });

    // The theme change sets the new background: light or dark.
    const into = (background: string) => () => document.documentElement.style.setProperty('--background', background);

    // jsdom has no WebGL: a context that accepts everything.
    const withGpu = () => {
        document.documentElement.setAttribute('data-zen-graphics', 'full');
        const gl = new Proxy({}, { get: () => () => ({}) }) as WebGLRenderingContext;
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(gl as unknown as RenderingContext);
    };
    // A clip-path polygon's points, as distances from (100, 200).
    const reach = (clipPath: unknown) =>
        String(clipPath)
            .slice('polygon('.length, -1)
            .split(',')
            .map((point) => {
                const [px, py] = point.trim().split(' ').map(parseFloat);
                return Math.hypot(px - 100, py - 200);
            });

    it('without a GPU, just changes the theme: drawn on the CPU, even a circle stutters', () => {
        document.documentElement.setAttribute('data-zen-graphics', 'lite');
        const start = vi.spyOn(document, 'startViewTransition');
        const change = vi.fn(into('0.98 0 0'));
        themeWave(change, { x: 100, y: 200 });
        expect(change).toHaveBeenCalledOnce();
        expect(start).not.toHaveBeenCalled();
        expect(document.documentElement).not.toHaveClass('zen-theme-waving');
    });

    it('into a dark theme, closes the old one in to the point instead', async () => {
        withGpu();
        themeWave(into('0.15 0 0'), { x: 100, y: 200 });
        // The old theme is drawn over the new while it closes.
        expect(document.documentElement).toHaveClass('zen-theme-closing');
        await new Promise((resolve) => setTimeout(resolve));

        const [keyframes, options] = animate.mock.calls[0];
        expect(options).toMatchObject({ pseudoElement: '::view-transition-old(root)' });
        const frames = keyframes as Keyframe[];
        // From past the far corner, (1000, 800), to the point.
        for (const r of reach(frames[0].clipPath)) expect(r).toBeGreaterThan(Math.hypot(900, 600));
        for (const r of reach(frames.at(-1)!.clipPath)) expect(r).toBeLessThan(0.1);
        // It holds the closed ring to the end, then lets go, so the next change starts clean.
        expect(options).toMatchObject({ fill: 'forwards' });
        cancelClip.mockClear();
        await settle();
        expect(cancelClip).toHaveBeenCalledOnce();
        expect(document.documentElement).not.toHaveClass('zen-theme-closing');
    });

    it('with a GPU, draws the water over the page in a wavy ring', async () => {
        withGpu();
        themeWave(into('0.98 0 0'), { x: 100, y: 200 });
        // Added with the new theme, in a view-transition layer of its own.
        const canvas = document.querySelector('canvas');
        expect(canvas?.getAttribute('style')).toContain('zen-theme-water');
        await new Promise((resolve) => setTimeout(resolve));

        const keyframes = animate.mock.calls[0][0] as Keyframe[];
        expect(String(keyframes[0].clipPath)).toMatch(/^polygon\(100(\.0)?px 200(\.0)?px/);
        // By the reveal's end, every point of the edge is past the far corner, (1000, 800).
        for (const r of reach(keyframes.at(-1)!.clipPath)) expect(r).toBeGreaterThan(Math.hypot(900, 600));
        await settle();
        expect(canvas?.isConnected).toBe(false);
        expect(document.documentElement).not.toHaveClass('zen-theme-waving');
    });

    it('takes the water off the page before a switch mid-wave is captured', () => {
        withGpu();
        themeWave(into('0.98 0 0'), { x: 100, y: 200 });
        const canvas = document.querySelector('canvas')!;
        expect(canvas.isConnected).toBe(true);
        // The browser captures the old page when the transition starts: the water mustn't be in it.
        let inOldPage: boolean | undefined;
        const start = document.startViewTransition!;
        document.startViewTransition = ((update: () => void) => {
            inOldPage = canvas.isConnected;
            return start(update);
        }) as typeof document.startViewTransition;
        themeWave(into('0.15 0 0'), { x: 100, y: 200 });
        expect(inOldPage).toBe(false);
    });
});
