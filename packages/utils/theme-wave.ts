import { applyGraphicsMode } from './graphics';
import { oklchToLinearRgb } from './theme';

// Into a light theme, the new theme spreads from the switch to the far corners
// in this long (ms): quick off the switch, slowing towards the far edges.
const DURATION = 1330;
const EASE: Bezier = [0.25, 0.55, 0.35, 1];
// Into a dark one, the old theme is pulled into the switch instead, faster and
// faster as it falls in.
const CLOSE_DURATION = 1050;
const FALL: Bezier = [0.55, 0, 0.85, 0.35];
// How wavy the edge is: a share of its radius, up to a limit in px.
const WOBBLE = 0.05;
const MAX_WOBBLE = 36;
// The edge's waviness, as [lobes round the circle, how fast they turn, share]:
// several at different speeds, so the edge keeps changing shape as it spreads.
const LOBES = [
    [3, 1.9, 0.5],
    [5, -2.7, 0.3],
    [8, 4.1, 0.2],
] as const;
// Keyframes the wavy edge is drawn with, and points round it.
const FRAMES = 48;
const POINTS = 72;
// The ripples' wavelength (px): fixed, as real ripples' is, so a bigger screen has more of them, not bigger ones.
const WAVELENGTH = 28;
const CLASS = 'zen-theme-waving';
const CLOSING = 'zen-theme-closing';
const NAME = 'zen-theme-water';
// A theme on one element: its view-transition layer, while it changes.
const AREA = 'zen-theme-area';

type Bezier = [number, number, number, number];

let running = 0;
// The target in its own layer, and the view-transition-name it had: given back when its wave ends or is cut short.
let area: { style: CSSStyleDeclaration; name: string } | null = null;
function releaseArea() {
    if (area) area.style.viewTransitionName = area.name;
    area = null;
}

/** 0 below a, 1 above b, eased between (GLSL's smoothstep). */
function smoothstep(a: number, b: number, t: number): number {
    const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
    return x * x * (3 - 2 * x);
}

/** A CSS cubic-bezier easing: progress in time → progress of the value. */
function bezier([x1, y1, x2, y2]: Bezier, t: number): number {
    const at = (a: number, b: number, s: number) => 3 * a * s * (1 - s) ** 2 + 3 * b * s ** 2 * (1 - s) + s ** 3;
    // Solve x(s) = t by bisection: exact enough and never diverges.
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2;
        if (at(x1, x2, mid) < t) lo = mid;
        else hi = mid;
    }
    return at(y1, y2, (lo + hi) / 2);
}

/** How far the edge of a circle of radius r sticks out at angle a, t seconds in (the shader's wobble()). */
function wobble(a: number, r: number, t: number, seed: number): number {
    const size = Math.min(MAX_WOBBLE, WOBBLE * r);
    return (
        size *
        LOBES.reduce((sum, [n, speed, share], i) => sum + share * Math.sin(n * a + speed * t + seed * (i + 1)), 0)
    );
}

// The water, worked out for every pixel, every frame. Distances are in CSS px,
// times in seconds. It draws only light: the ripples' glints and shade (which
// make the page under them look rippled), a prism's rainbow on the edge, and a
// band of aurora behind it.
const SHADER = `
precision highp float;
uniform vec2 res;
uniform float dpr;
uniform vec2 from;
uniform float time;
uniform float seed;
uniform float strength;
// 1 while the edge spreads out, -1 while it closes in.
uniform float dir;
uniform float edge;
uniform float prism;
uniform vec3 aurora[3];
uniform float light;

float wobble(float a, float r) {
    float size = min(${MAX_WOBBLE.toFixed(1)}, ${WOBBLE.toFixed(3)} * r);
    return size * (${LOBES.map(
        ([n, speed, share], i) =>
            `${share.toFixed(2)} * sin(${n.toFixed(1)} * a + ${speed.toFixed(2)} * time + seed * ${(i + 1).toFixed(1)})`,
    ).join(' + ')});
}

// A train of ripples whose front is x px away (ahead of it when positive, as it moves):
// a steep front, crests fading out behind it, and running outwards through
// the train faster than it spreads, as on water. Its slope (height per px of x): the
// ripples are a fixed size, as real ones are, however big the water.
float rippleSlope(float x) {
    float k = 6.2832 / ${WAVELENGTH.toFixed(1)};
    float reach = x < 0.0 ? ${(2.5 * WAVELENGTH).toFixed(1)} : ${(0.35 * WAVELENGTH).toFixed(1)};
    float phase = k * x - 7.0 * time;
    return exp(-x * x / (2.0 * reach * reach)) * (-x / (reach * reach) * cos(phase) / k - sin(phase));
}

// Light from the top left. A glint off a surface of this slope, bent a little
// more or less for each colour, so glints split into a rainbow at their edges.
const vec3 LIGHT = vec3(-0.45, -0.55, 0.7);
float glint(vec2 slope, float bend) {
    vec3 n = normalize(vec3(-slope * bend, 1.0));
    vec3 mid = normalize(normalize(LIGHT) + vec3(0.0, 0.0, 1.0));
    return max(0.0, pow(max(dot(n, mid), 0.0), 40.0) - pow(mid.z, 40.0));
}

void main() {
    vec2 p = vec2(gl_FragCoord.x, res.y - gl_FragCoord.y) / dpr;
    vec2 v = p - from;
    float a = atan(v.y, v.x);
    // How far from the edge (outside it when positive).
    float e = length(v) - edge - wobble(a, edge);
    // The ripples' slope: across their rings, outwards.
    vec2 slope = 0.9 * strength * dir * rippleSlope(dir * e) * v / max(length(v), 0.001);

    // Aurora: the glow colours, drifting round the circle.
    float hue = fract(a / 6.2832 + 0.15 * time + length(v) * 0.0008) * 3.0;
    vec3 tint = hue < 1.0 ? mix(aurora[0], aurora[1], hue)
        : hue < 2.0 ? mix(aurora[1], aurora[2], hue - 1.0)
        : mix(aurora[2], aurora[0], hue - 2.0);

    // Iridescence, as on a soap film: the colour turns with the film's thickness,
    // which swells and thins round the ring and over time, slowly, and in soft
    // colours: nothing flickers, or flashes saturated colour (photosensitivity).
    float film = 0.02 * e + 0.35 * sin(2.0 * a + 0.6 * time + seed) + 0.25 * sin(5.0 * a - 0.9 * time) + 0.25 * time;
    vec3 sheen = mix(mix(tint, 0.5 + 0.5 * cos(6.2832 * (film + vec3(0.0, 0.33, 0.67))), 0.5), vec3(1.0), 0.2);

    vec3 spark = vec3(glint(slope, 0.8), glint(slope, 1.0), glint(slope, 1.2));
    // Slopes facing the light are lit, the others shaded.
    float facing = dot(normalize(vec3(-slope, 1.0)), normalize(LIGHT)) - normalize(LIGHT).z;
    vec3 color = 1.6 * spark * mix(vec3(1.0), mix(tint, sheen, 0.6), mix(0.4, 0.85, light)) + 0.6 * max(facing, 0.0) * tint;
    float shade = mix(0.7, 0.45, light) * max(-facing, 0.0);

    // The edge: a band of sheen with a bright core, and the aurora trailing behind.
    color += prism * (0.9 * sheen * exp(-e * e / 160.0) + 0.5 * exp(-e * e / 6.0));
    color += prism * 0.45 * tint * exp(-(e + 28.0 * dir) * (e + 28.0 * dir) / 1800.0);

    color = clamp(color, 0.0, 1.0);
    float cover = max(color.r, max(color.g, color.b));
    gl_FragColor = vec4(color, cover + shade * (1.0 - cover));
}`;

const VERTEX = 'attribute vec2 at; void main() { gl_Position = vec4(at, 0.0, 1.0); }';

interface Water {
    canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext;
    uniform: (name: string) => WebGLUniformLocation | null;
}

let water: Water | null | undefined;

/** The canvas the water is drawn on, made once; null without WebGL. */
function waterCanvas(): Water | null {
    if (water !== undefined) return water;
    water = null;
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = `position:fixed;pointer-events:none;z-index:2147483647;view-transition-name:${NAME}`;
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false });
    const program = gl?.createProgram();
    if (!gl || !program) return null;
    for (const [type, source] of [
        [gl.VERTEX_SHADER, VERTEX],
        [gl.FRAGMENT_SHADER, SHADER],
    ] as const) {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        gl.attachShader(program, shader);
    }
    gl.bindAttribLocation(program, 0, 'at');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    gl.useProgram(program);
    // One triangle over the whole screen.
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const locations = new Map<string, WebGLUniformLocation | null>();
    const uniform = (name: string) => {
        if (!locations.has(name)) locations.set(name, gl.getUniformLocation(program, name));
        return locations.get(name)!;
    };
    water = { canvas, gl, uniform };
    return water;
}

/** Takes the water off the page, blank, so no later snapshot or frame shows what it last drew. */
function drain(gpu: Water) {
    gpu.gl.clear(gpu.gl.COLOR_BUFFER_BIT);
    gpu.canvas.remove();
}

/** A theme colour (an OKLCH triplet) as sRGB 0–1, for the shader. */
function srgb(triplet: string): number[] {
    return oklchToLinearRgb(triplet).map((c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055));
}

/** Whether a switch draws the water; otherwise the theme just changes (see themeWave). */
function wavy(): boolean {
    const reduced =
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
        document.documentElement.classList.contains('reduce-motion');
    return !reduced && !!document.startViewTransition && applyGraphicsMode() !== 'lite';
}

/**
 * Gets the water ready before a switch, e.g. when the pointer or focus reaches
 * the button: its shader is compiled and drawn once, off the page. The GPU
 * driver otherwise finishes that work on the first frame of the first switch,
 * which then hitches.
 */
export function prepareThemeWave(): void {
    if (water !== undefined || !wavy()) return;
    const gpu = waterCanvas();
    gpu?.gl.drawArrays(gpu.gl.TRIANGLES, 0, 3);
}

/**
 * Changes the theme (`change` swaps the classes or variables) like a drop
 * falling into water at `from` (an element's centre, or a point; the centre
 * by default). The water fills the page or, for a theme on one element (a
 * panel, a preview: `target`, the element whose classes or variables
 * `change` swaps), just that element. Into a light theme, the new theme spreads in a wavy
 * ring; into a dark one, the old theme is pulled into the point. Ripples trail the ring's edge, glinting in the
 * theme's glow colours, and the edge shimmers like a soap film. The water is
 * drawn on the GPU, over the page, which itself doesn't bend. Without a GPU
 * (lite graphics, or no WebGL), without view transitions, or with reduced
 * motion (the OS setting or html.reduce-motion), the theme just changes: drawn
 * on the CPU, even a plain full-screen circle stutters. Call prepareThemeWave
 * when the pointer or focus reaches the switch, so the first switch is smooth.
 */
export function themeWave(
    change: () => void,
    from?: Element | { x: number; y: number } | null,
    target?: Element | null,
): void {
    const root = document.documentElement;
    const scoped = !!target && target !== root;
    const w = window.innerWidth;
    const h = window.innerHeight;
    // The area that changes (the page, or the target), and the part of it on screen, which the water covers.
    const box = scoped ? target.getBoundingClientRect() : new DOMRect(0, 0, w, h);
    const left = Math.max(0, box.left);
    const top = Math.max(0, box.top);
    const right = Math.min(w, box.right);
    const bottom = Math.min(h, box.bottom);
    const gpu = wavy() && right > left && bottom > top ? waterCanvas() : null;
    if (!gpu) {
        change();
        return;
    }

    let x = (left + right) / 2;
    let y = (top + bottom) / 2;
    if (from instanceof Element) {
        const r = from.getBoundingClientRect();
        x = r.left + r.width / 2;
        y = r.top + r.height / 2;
    } else if (from) {
        ({ x, y } = from);
    }
    const corner = Math.hypot(Math.max(x - box.left, box.right - x), Math.max(y - box.top, box.bottom - y));
    const seed = Math.random() * 2 * Math.PI;
    // Past the furthest corner, however far the wobble pulls the edge in.
    const radius = corner + MAX_WOBBLE + 2;

    // The class scopes the view-transition styles to this change, so an app's own
    // (e.g. route) view transitions keep theirs.
    const id = ++running;
    // A wave still running is cut short (the browser skips its transition): its water
    // goes first, or the new transition would capture it, still, as part of the old page.
    drain(gpu);
    releaseArea();
    root.classList.add(CLASS);
    // A target is captured in a layer of its own (the rest of the page doesn't change), its corners kept.
    const layer = scoped ? AREA : 'root';
    if (scoped) {
        const { style } = target as HTMLElement | SVGElement;
        area = { style, name: style.viewTransitionName };
        style.viewTransitionName = AREA;
    }
    Object.assign(gpu.canvas.style, {
        left: `${left}px`,
        top: `${top}px`,
        width: `${right - left}px`,
        height: `${bottom - top}px`,
        clipPath: scoped
            ? `inset(${box.top - top}px ${right - box.right}px ${bottom - box.bottom}px ${box.left - left}px round ${getComputedStyle(target).borderRadius})`
            : '',
    });
    let aurora: number[] = [];
    let closing = false;
    const transition = document.startViewTransition(() => {
        change();
        const style = getComputedStyle(scoped ? target : root);
        // Into a dark theme, the old (light) one closes in, drawn over the new.
        closing = Number(style.getPropertyValue('--background').trim().split(' ')[0]) <= 0.5;
        root.classList.toggle(CLOSING, closing);
        // The water, in the new theme's colours, goes over the page (its own view-transition layer).
        const glow = style.getPropertyValue('--glow').trim();
        const [L, C, H] = glow.split(' ').map(Number);
        // The glow colours and, for an aurora's green, the glow turned a third of the way round.
        aurora = [glow, style.getPropertyValue('--glow-2').trim(), `${L} ${C} ${(H + 240) % 360}`].flatMap(srgb);
        document.body.append(gpu.canvas);
    });
    transition.ready
        .then(() => {
            const duration = closing ? CLOSE_DURATION : DURATION;
            // How far the ring's edge is from the point, t of the way through its move.
            const reach = (t: number) => (closing ? 1 - bezier(FALL, t) : bezier(EASE, t)) * radius;
            // The ring is cut out of the new theme as it spreads, or of the old as it closes in.
            const pseudoElement = `::view-transition-${closing ? 'old' : 'new'}(${layer})`;
            const ring = (t: number) => {
                const r = reach(t);
                const seconds = (t * duration) / 1000;
                const points = Array.from({ length: POINTS }, (_, i) => {
                    const a = (i / POINTS) * 2 * Math.PI;
                    const out = Math.max(0, r + wobble(a, r, seconds, seed));
                    // In the layer's own box.
                    return `${(x - box.left + out * Math.cos(a)).toFixed(1)}px ${(y - box.top + out * Math.sin(a)).toFixed(1)}px`;
                });
                return `polygon(${points.join(',')})`;
            };
            // The edge, sampled finely into keyframes (the shader's ripples ride it). It holds its last frame
            // until the transition ends (let go, the old page would show whole for a frame),
            // and no longer: held on, it would clip the next transition's pages too.
            const keyframes: Keyframe[] = Array.from({ length: FRAMES + 1 }, (_, f) => ({
                clipPath: ring(f / FRAMES),
                offset: f / FRAMES,
            }));
            const clock = root.animate(keyframes, { duration, pseudoElement, fill: 'forwards' });
            transition.finished.finally(() => clock.cancel());

            const { canvas, gl, uniform } = gpu;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round((right - left) * dpr);
            canvas.height = Math.round((bottom - top) * dpr);
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.uniform2f(uniform('res'), canvas.width, canvas.height);
            gl.uniform1f(uniform('dpr'), dpr);
            gl.uniform2f(uniform('from'), x - left, y - top);
            gl.uniform1f(uniform('seed'), seed);
            gl.uniform3fv(uniform('aurora[0]'), aurora);
            gl.uniform1f(uniform('light'), closing ? 0 : 1);

            // Filling, the water comes in calm and its ripples build as more pours in, then
            // settle as it fills: gone at t = 1. No splash.
            const swell = (t: number) => 1.6 * smoothstep(0.05, 0.45, t) * (1 - t) ** 1.5;
            const frame = () => {
                if (id !== running) return;
                // Nothing left on the canvas while it's still in the page, after the transition.
                if (clock.playState === 'finished') return drain(gpu);
                const p = Math.min(1, Number(clock.currentTime ?? 0) / duration);
                const edge = reach(p);
                // Everything fades to nothing by the end, so whichever frame is the last drawn
                // before the transition ends (and the canvas is still in the page), it's blank.
                const fade = Math.min(1, (1 - p) / 0.12);
                let strength: number, prism: number;
                if (closing) {
                    // Gathering as it falls in, and gone as it closes.
                    strength = 1.6 * p * Math.sqrt(1 - p) * fade;
                    prism = Math.min(1, p * 4) * Math.min(1, edge / 24) * fade;
                } else {
                    strength = swell(p) * fade;
                    // The sheen shows once the edge is off the switch, and fades as it reaches the corners.
                    prism = Math.min(1, edge / 40) * (1 - p ** 3) * fade;
                }
                gl.uniform1f(uniform('time'), (p * duration) / 1000);
                gl.uniform1f(uniform('edge'), edge);
                gl.uniform1f(uniform('dir'), closing ? -1 : 1);
                gl.uniform1f(uniform('strength'), strength);
                gl.uniform1f(uniform('prism'), prism);
                gl.drawArrays(gl.TRIANGLES, 0, 3);
                requestAnimationFrame(frame);
            };
            frame();
        })
        .catch(() => {});
    transition.finished.finally(() => {
        if (id !== running) return;
        releaseArea();
        root.classList.remove(CLASS, CLOSING);
        drain(gpu);
    });
}
