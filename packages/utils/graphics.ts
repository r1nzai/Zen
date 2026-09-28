import { useEffect } from 'react';

/**
 * Graphics mode: with hardware acceleration off, the browser draws on the CPU,
 * where live blurs, full-screen masks and constant animation turn every frame
 * into a stall. Zen then switches to "lite": solid tints instead of blur, a
 * still backdrop, no pointer light (see the html[data-zen-graphics='lite'] rules
 * in index.css). Set data-zen-graphics on <html> yourself to force a mode.
 */
export type GraphicsMode = 'full' | 'lite';

const ATTR = 'data-zen-graphics';

// Renderers that mean "drawing on the CPU".
const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render driver|mesa offscreen/i;

let detected: GraphicsMode | undefined;

/** Whether the GPU is doing the drawing, checked once (a throwaway WebGL context). */
export function detectGraphicsMode(): GraphicsMode {
    if (detected) return detected;
    if (typeof document === 'undefined') return 'full';
    try {
        const canvas = document.createElement('canvas');
        // Refuses to create a context when WebGL would run in software.
        const gl = (canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true }) ??
            canvas.getContext('experimental-webgl', {
                failIfMajorPerformanceCaveat: true,
            })) as WebGLRenderingContext | null;
        if (!gl) {
            detected = 'lite';
        } else {
            const info = gl.getExtension('WEBGL_debug_renderer_info');
            const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '');
            detected = SOFTWARE.test(renderer) ? 'lite' : 'full';
            gl.getExtension('WEBGL_lose_context')?.loseContext();
        }
    } catch {
        // No WebGL at all is itself a sign of no acceleration.
        detected = 'lite';
    }
    return detected;
}

/**
 * Marks <html> with the graphics mode, unless the app already set one. Called by
 * the components with costly effects; cheap after the first call.
 */
export function applyGraphicsMode(): GraphicsMode {
    if (typeof document === 'undefined') return 'full';
    const root = document.documentElement;
    const preset = root.getAttribute(ATTR);
    if (preset === 'full' || preset === 'lite') return preset;
    const mode = detectGraphicsMode();
    root.setAttribute(ATTR, mode);
    return mode;
}

/** For tests: forget the cached detection. */
export function resetGraphicsMode() {
    detected = undefined;
}

/** Applies the graphics mode after mount (in components whose effects are costly without a GPU). */
export function useGraphicsMode() {
    useEffect(() => {
        applyGraphicsMode();
    }, []);
}
