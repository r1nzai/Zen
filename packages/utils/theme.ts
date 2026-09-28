/**
 * Theme generation: a few inputs → every colour token, in OKLCH. Lightness is
 * fixed per UI role and the inputs only move hue and chroma, so contrast holds
 * for any colour (the tests sweep every hue and check WCAG). Roles run from the
 * app background through surfaces and borders to solid colour and text. Colour
 * is used sparingly: neutrals carry the UI, the accent marks what matters.
 */

export const INTENSITIES = ['mono', 'muted', 'balanced', 'vivid'] as const;
export type Intensity = (typeof INTENSITIES)[number];
export type Appearance = 'dark' | 'light';

export interface ThemeSettings {
    preset: PresetId | 'custom';
    /** OKLCH hue angle, 0–359. */
    hue: number;
    intensity: Intensity;
    /** Neutral greys, or greys faintly tinted with the accent hue. */
    tint: 'neutral' | 'tinted';
    contrast: 'standard' | 'high';
    glow: 'off' | 'soft' | 'bright';
    /** Strength of the Backdrop's pattern (contours or dots). */
    topography: 'off' | 'subtle' | 'visible';
}

export const PRESETS = [
    { id: 'violet', label: 'Violet', hue: 295, intensity: 'balanced', tint: 'tinted' },
    { id: 'ocean', label: 'Ocean', hue: 250, intensity: 'balanced', tint: 'tinted' },
    { id: 'teal', label: 'Teal', hue: 195, intensity: 'balanced', tint: 'tinted' },
    { id: 'forest', label: 'Forest', hue: 150, intensity: 'muted', tint: 'tinted' },
    { id: 'amber', label: 'Amber', hue: 75, intensity: 'balanced', tint: 'neutral' },
    { id: 'rose', label: 'Rose', hue: 15, intensity: 'muted', tint: 'neutral' },
    { id: 'graphite', label: 'Graphite', hue: 270, intensity: 'mono', tint: 'neutral' },
] as const satisfies readonly {
    id: string;
    label: string;
    hue: number;
    intensity: Intensity;
    tint: ThemeSettings['tint'];
}[];
export type PresetId = (typeof PRESETS)[number]['id'];

/** Zen's default: violet, balanced, tinted greys, soft glow. */
export const DEFAULT_THEME: ThemeSettings = {
    preset: 'violet',
    hue: 295,
    intensity: 'balanced',
    tint: 'tinted',
    contrast: 'standard',
    glow: 'soft',
    topography: 'subtle',
};

/** A preset's colour inputs, keeping the other settings. */
export function applyPreset(theme: ThemeSettings, id: PresetId): ThemeSettings {
    const p = PRESETS.find((x) => x.id === id)!;
    return { ...theme, preset: p.id, hue: p.hue, intensity: p.intensity, tint: p.tint };
}

/** Any edit to the colour inputs makes it a custom theme. */
export function customize(
    theme: ThemeSettings,
    patch: Partial<Pick<ThemeSettings, 'hue' | 'intensity' | 'tint'>>,
): ThemeSettings {
    return { ...theme, ...patch, preset: 'custom' };
}

const CHROMA: Record<Intensity, number> = { mono: 0.012, muted: 0.07, balanced: 0.13, vivid: 0.19 };

/** "L C H" triplet, used as oklch(var(--x)) or oklch(var(--x) / alpha). */
const t = (l: number, c: number, h: number) => `${round(l, 3)} ${round(c, 3)} ${round(((h % 360) + 360) % 360, 1)}`;
const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;

/** The CSS custom properties (without the leading --) for a theme, dark or light. */
export function themeVars(theme: ThemeSettings, appearance: Appearance = 'dark'): Record<string, string> {
    const h = theme.hue;
    const c = CHROMA[theme.intensity];
    const hi = theme.contrast === 'high';
    const tintC = theme.tint === 'tinted' ? Math.min(0.014, c * 0.12) : 0.003;
    const mono = theme.intensity === 'mono';
    const n = (l: number, extra = 1) => t(l, tintC * extra, h); // neutral role
    const strengths = {
        'topo-strength': String({ off: 0, subtle: 0.55, visible: 1 }[theme.topography]),
    };

    if (appearance === 'light') {
        return {
            background: n(hi ? 0.995 : 0.985, 0.4),
            foreground: t(hi ? 0.16 : 0.21, 0.02, h),
            card: t(1, 0, 0),
            'card-foreground': t(hi ? 0.16 : 0.21, 0.02, h),
            popover: t(1, 0, 0),
            'popover-foreground': t(hi ? 0.16 : 0.21, 0.02, h),
            secondary: n(0.955, 0.6),
            'secondary-foreground': t(0.21, 0.02, h),
            muted: n(0.96, 0.5),
            'muted-foreground': n(hi ? 0.42 : 0.5, 1.5),
            border: n(hi ? 0.78 : 0.91, 0.8),
            input: n(hi ? 0.78 : 0.91, 0.8),
            primary: t(mono ? 0.3 : 0.48, mono ? 0.02 : Math.min(0.22, c * 1.5), h),
            'primary-foreground': t(0.985, 0, 0),
            accent: t(0.95, mono ? 0.005 : c * 0.25, h),
            'accent-foreground': t(0.42, mono ? 0.02 : Math.min(0.16, c * 0.9), h),
            ring: t(mono ? 0.3 : 0.48, mono ? 0.02 : Math.min(0.22, c * 1.5), h),
            destructive: t(0.55, 0.22, 25),
            'destructive-foreground': t(0.985, 0, 0),
            glow: t(0.62, mono ? 0.02 : Math.min(0.2, c * 1.4), h),
            'glow-2': t(0.65, mono ? 0.02 : c * 1.05, h + 30),
            tint: t(0.21, 0.02, h),
            'glow-strength': String({ off: 0, soft: 0.4, bright: 0.8 }[theme.glow]),
            ...strengths,
        };
    }

    return {
        background: n(hi ? 0.13 : 0.155),
        foreground: t(0.97, 0.004, h),
        card: n(hi ? 0.17 : 0.195),
        'card-foreground': t(0.97, 0.004, h),
        popover: n(hi ? 0.18 : 0.21),
        'popover-foreground': t(0.97, 0.004, h),
        secondary: n(0.25),
        'secondary-foreground': t(0.97, 0.004, h),
        muted: n(0.235),
        'muted-foreground': n(hi ? 0.84 : 0.72, 1.5),
        border: n(hi ? 0.4 : 0.28, 1.5),
        input: n(hi ? 0.4 : 0.28, 1.5),
        primary: t(mono ? 0.88 : 0.72, c, h),
        'primary-foreground': t(mono ? 0.2 : 0.17, mono ? 0.01 : 0.03, h),
        accent: t(0.3, c * 0.35, h),
        'accent-foreground': t(0.88, c * 0.5, h),
        ring: t(0.72, c, h),
        destructive: t(0.64, 0.2, 25),
        'destructive-foreground': t(0.985, 0, 0),
        glow: t(0.7, mono ? 0.02 : c, h),
        // Analogous second light (a little further round the wheel), not a contrasting colour.
        'glow-2': t(0.72, mono ? 0.02 : c * 0.75, h + 30),
        tint: t(1, 0, 0),
        'glow-strength': String({ off: 0, soft: 0.55, bright: 1 }[theme.glow]),
        ...strengths,
    };
}

/**
 * Applies a theme's tokens to an element (default <html>) as inline custom
 * properties, overriding the stylesheet's defaults below it. Pass the
 * appearance that element shows (dark unless it or an ancestor is .light).
 */
export function applyTheme(
    theme: ThemeSettings,
    { appearance = 'dark', target }: { appearance?: Appearance; target?: HTMLElement } = {},
): void {
    const el = target ?? document.documentElement;
    for (const [k, v] of Object.entries(themeVars(theme, appearance))) el.style.setProperty(`--${k}`, v);
}

/** Removes an applied theme, back to the stylesheet's defaults. */
export function resetTheme(target?: HTMLElement): void {
    const el = target ?? document.documentElement;
    for (const k of Object.keys(themeVars(DEFAULT_THEME))) el.style.removeProperty(`--${k}`);
}

/** Coerces stored (possibly older or edited) data into a valid theme. */
export function normalizeTheme(raw: unknown): ThemeSettings {
    const r = (typeof raw === 'object' && raw !== null ? raw : {}) as Partial<Record<keyof ThemeSettings, unknown>>;
    const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
        allowed.includes(v as T) ? (v as T) : fallback;
    const d = DEFAULT_THEME;
    const presetIds = PRESETS.map((p) => p.id) as readonly string[];
    return {
        preset:
            typeof r.preset === 'string' && (r.preset === 'custom' || presetIds.includes(r.preset))
                ? (r.preset as ThemeSettings['preset'])
                : d.preset,
        hue: typeof r.hue === 'number' && Number.isFinite(r.hue) ? ((Math.round(r.hue) % 360) + 360) % 360 : d.hue,
        intensity: pick(r.intensity, INTENSITIES, d.intensity),
        tint: pick(r.tint, ['neutral', 'tinted'] as const, d.tint),
        contrast: pick(r.contrast, ['standard', 'high'] as const, d.contrast),
        glow: pick(r.glow, ['off', 'soft', 'bright'] as const, d.glow),
        topography: pick(r.topography, ['off', 'subtle', 'visible'] as const, d.topography),
    };
}

// ── Contrast checking ──

/** OKLCH triplet → linear sRGB (clamped to gamut). */
export function oklchToLinearRgb(triplet: string): [number, number, number] {
    const [L, C, H] = triplet.split(' ').map(Number);
    const a = C * Math.cos((H * Math.PI) / 180);
    const b = C * Math.sin((H * Math.PI) / 180);
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    const clamp = (x: number) => Math.min(1, Math.max(0, x));
    return [
        clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
        clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
        clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    ];
}

/** WCAG 2 contrast ratio between two OKLCH triplets. */
export function contrastRatio(a: string, b: string): number {
    const lum = (x: string) => {
        const [r, g, bl] = oklchToLinearRgb(x);
        return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
    };
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
}
