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
        // As browsers do: ready once the update (which may be async) is done.
        document.startViewTransition = ((update: () => void | Promise<void>) => {
            const done = Promise.resolve(update());
            return { ready: done, finished, updateCallbackDone: done, skipTransition() {} };
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
        await Promise.resolve(); // the update: the new theme read
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
        await Promise.resolve();
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

    it('with a target, plays inside it: its own layer, the water over just it, the theme read from it', async () => {
        withGpu();
        const panel = document.createElement('div');
        panel.style.viewTransitionName = 'card';
        panel.style.borderRadius = '12px';
        panel.getBoundingClientRect = () => new DOMRect(50, 150, 300, 200);
        document.body.append(panel);
        let named: string | undefined;
        // The page stays dark; the panel turns light.
        document.documentElement.style.setProperty('--background', '0.15 0 0');
        themeWave(
            () => {
                named = panel.style.viewTransitionName;
                panel.style.setProperty('--background', '0.98 0 0');
            },
            { x: 100, y: 200 },
            panel,
        );
        await Promise.resolve();
        expect(named).toBe('zen-theme-area');
        expect(document.documentElement).not.toHaveClass('zen-theme-closing');
        const canvas = document.querySelector('canvas')!;
        expect(canvas.style).toMatchObject({ left: '50px', top: '150px', width: '300px', height: '200px' });
        expect(canvas.style.clipPath).toContain('round 12px');
        await new Promise((resolve) => setTimeout(resolve));

        const [keyframes, options] = animate.mock.calls[0];
        expect(options).toMatchObject({ pseudoElement: '::view-transition-new(zen-theme-area)' });
        // In the panel's own box: from the point, (50, 50) in it, to past its far corner, (300, 200).
        const frames = keyframes as Keyframe[];
        expect(String(frames[0].clipPath)).toMatch(/^polygon\(50(\.0)?px 50(\.0)?px/);
        const inPanel = (clipPath: unknown) =>
            String(clipPath)
                .slice('polygon('.length, -1)
                .split(',')
                .map((point) =>
                    Math.hypot(
                        ...(point.trim().split(' ').map(parseFloat) as [number, number]).map((v, i) => v - [50, 50][i]),
                    ),
                );
        for (const r of inPanel(frames.at(-1)!.clipPath)) expect(r).toBeGreaterThan(Math.hypot(250, 150));
        await settle();
        // Its own view-transition-name back.
        expect(panel.style.viewTransitionName).toBe('card');
        panel.remove();
    });

    it('reads the new theme once whatever reacts to the change has, e.g. an observer re-applying its colours', async () => {
        withGpu();
        // Like an app whose colours are inline on <html>, worked out for .dark or .light, and
        // re-applied when a toggle flips the class: a MutationObserver, run in a microtask.
        const root = document.documentElement;
        root.style.setProperty('--background', '0.98 0 0');
        const watch = new MutationObserver(() =>
            root.style.setProperty('--background', root.classList.contains('dark') ? '0.15 0 0' : '0.98 0 0'),
        );
        watch.observe(root, { attributes: true, attributeFilter: ['class'] });
        themeWave(() => root.classList.add('dark'), { x: 100, y: 200 });
        await new Promise((resolve) => setTimeout(resolve));
        watch.disconnect();
        // Into dark: the old (light) theme closes in.
        expect(root).toHaveClass('zen-theme-closing');
        expect(animate.mock.calls[0][1]).toMatchObject({ pseudoElement: '::view-transition-old(root)' });
        await settle();
    });

    it("a target's layer name is given back when the next wave cuts its wave short", () => {
        withGpu();
        const [a, b] = [0, 1].map(() => {
            const panel = document.createElement('div');
            panel.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
            return panel;
        });
        themeWave(into('0.98 0 0'), null, a);
        expect(a.style.viewTransitionName).toBe('zen-theme-area');
        themeWave(into('0.15 0 0'), null, b);
        expect(a.style.viewTransitionName).toBe('');
        expect(b.style.viewTransitionName).toBe('zen-theme-area');
    });

    it('takes the water off the page before a switch mid-wave is captured', async () => {
        withGpu();
        themeWave(into('0.98 0 0'), { x: 100, y: 200 });
        await Promise.resolve();
        const canvas = document.querySelector('canvas')!;
        expect(canvas.isConnected).toBe(true);
        // The browser captures the old page when the transition starts: the water mustn't be in it.
        let inOldPage: boolean | undefined;
        const start = document.startViewTransition!;
        document.startViewTransition = ((update: () => void | Promise<void>) => {
            inOldPage = canvas.isConnected;
            return start(update);
        }) as typeof document.startViewTransition;
        themeWave(into('0.15 0 0'), { x: 100, y: 200 });
        expect(inOldPage).toBe(false);
    });

    it('readies the water ahead of a switch: compiled and drawn once, off the page, and only when a switch would draw it', async () => {
        vi.resetModules(); // a page that hasn't made the water yet
        const { prepareThemeWave } = await import('./theme-wave');
        const drawArrays = vi.fn();
        const gl = new Proxy({}, { get: (_, key) => (key === 'drawArrays' ? drawArrays : () => ({})) });
        const getContext = vi
            .spyOn(HTMLCanvasElement.prototype, 'getContext')
            .mockReturnValue(gl as unknown as RenderingContext);

        document.documentElement.setAttribute('data-zen-graphics', 'lite');
        prepareThemeWave();
        expect(getContext).not.toHaveBeenCalled();

        document.documentElement.setAttribute('data-zen-graphics', 'full');
        prepareThemeWave();
        prepareThemeWave();
        expect(getContext).toHaveBeenCalledOnce();
        expect(drawArrays).toHaveBeenCalledOnce();
        expect((getContext.mock.contexts[0] as HTMLCanvasElement).isConnected).toBe(false);
    });
});
