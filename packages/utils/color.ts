/** A colour in OKLCH: lightness 0–1, chroma, hue in degrees, and alpha 0–1. */
export interface Oklch {
    l: number;
    c: number;
    h: number;
    alpha: number;
}

/** Hue in degrees, saturation and value 0–1, alpha 0–1. */
export interface Hsv {
    h: number;
    s: number;
    v: number;
    a: number;
}

type Rgba = [number, number, number, number];

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** "#rgb", "#rgba", "#rrggbb" or "#rrggbbaa" → sRGB and alpha, 0–1; null if it isn't one. */
export function parseHex(hex: string): Rgba | null {
    const m = /^#?([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.exec(hex.trim());
    if (!m) return null;
    let digits = m[1];
    if (digits.length <= 4) digits = digits.replace(/./g, '$&$&');
    if (digits.length === 6) digits += 'ff';
    return [0, 2, 4, 6].map((i) => parseInt(digits.slice(i, i + 2), 16) / 255) as Rgba;
}

/** sRGB and alpha, 0–1 → "#rrggbb", or "#rrggbbaa" when not opaque. */
export function formatHex([r, g, b, a = 1]: readonly number[]): string {
    const byte = (x: number) =>
        Math.round(clamp01(x) * 255)
            .toString(16)
            .padStart(2, '0');
    return `#${byte(r)}${byte(g)}${byte(b)}${a < 1 ? byte(a) : ''}`;
}

export function hexToHsv(hex: string): Hsv | null {
    const rgba = parseHex(hex);
    if (!rgba) return null;
    const [r, g, b, a] = rgba;
    const max = Math.max(r, g, b);
    const d = max - Math.min(r, g, b);
    let h = 0;
    if (d) {
        if (max === r) h = ((g - b) / d) % 6;
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
    }
    return { h: (h * 60 + 360) % 360, s: max ? d / max : 0, v: max, a };
}

export function hsvToHex({ h, s, v, a }: Hsv): string {
    const f = (n: number) => {
        const k = (n + h / 60) % 6;
        return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
    };
    return formatHex([f(5), f(3), f(1), a]);
}

/** sRGB 0–1 → linear light. */
export const srgbToLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
/** Linear light → sRGB 0–1. */
export const linearToSrgb = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

/** OKLCH → linear sRGB, clamped to gamut. */
export function oklchToLinear(l: number, c: number, h: number): [number, number, number] {
    const a = c * Math.cos((h * Math.PI) / 180);
    const b = c * Math.sin((h * Math.PI) / 180);
    const L = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const M = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const S = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
    return [
        clamp01(4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S),
        clamp01(-1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S),
        clamp01(-0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S),
    ];
}

/** A hex colour in OKLCH, e.g. to give its hue and chroma to the theme engine; null if it isn't one. */
export function hexToOklch(hex: string): Oklch | null {
    const rgba = parseHex(hex);
    if (!rgba) return null;
    const [r, g, b] = rgba.slice(0, 3).map(srgbToLinear);
    const L = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const M = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const S = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    const l = 0.2104542553 * L + 0.793617785 * M - 0.0040720468 * S;
    const A = 1.9779984951 * L - 2.428592205 * M + 0.4505937099 * S;
    const B = 0.0259040371 * L + 0.7827717662 * M - 0.808675766 * S;
    const c = Math.hypot(A, B);
    // Greys have no hue; 0 rather than float noise.
    const h = c < 1e-4 ? 0 : ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
    return { l, c, h, alpha: rgba[3] };
}

/** OKLCH as hex; colours outside sRGB are clamped to it. */
export function oklchToHex({ l, c, h, alpha = 1 }: Omit<Oklch, 'alpha'> & { alpha?: number }): string {
    return formatHex([...oklchToLinear(l, c, h).map(linearToSrgb), alpha]);
}
