// Ported from Sora's theme tests, extended to the light appearance.
import { readFileSync } from 'node:fs';

import {
    type Appearance,
    applyPreset,
    applyTheme,
    contrastRatio,
    customize,
    DEFAULT_THEME,
    INTENSITIES,
    normalizeTheme,
    PRESETS,
    resetTheme,
    type ThemeSettings,
    themeVars,
} from './theme';

const everyTheme = (): ThemeSettings[] => {
    const out: ThemeSettings[] = PRESETS.map((p) => applyPreset(DEFAULT_THEME, p.id));
    for (let hue = 0; hue < 360; hue += 15) {
        for (const intensity of INTENSITIES) {
            for (const contrast of ['standard', 'high'] as const) {
                for (const tint of ['neutral', 'tinted'] as const)
                    out.push({ ...DEFAULT_THEME, preset: 'custom', hue, intensity, contrast, tint });
            }
        }
    }
    return out;
};

describe.each(['dark', 'light'] as Appearance[])(
    'themeVars (%s): readable for every preset and hue (WCAG 2)',
    (appearance) => {
        it.each([
            ['body text on background', 'foreground', 'background', 7],
            ['body text on cards', 'card-foreground', 'card', 7],
            ['secondary text on cards', 'muted-foreground', 'card', 4.5],
            ['secondary text on muted surfaces', 'muted-foreground', 'muted', 4.5],
            ['primary button label', 'primary-foreground', 'primary', 4.5],
            ['accent text on accent surface', 'accent-foreground', 'accent', 4.5],
            ['primary-coloured text on cards', 'primary', 'card', 4.5],
            ['destructive text on cards', 'destructive', 'card', 3],
            ['focus ring against background (non-text)', 'ring', 'background', 3],
        ])('%s ≥ %s', (_, fg, bg, min) => {
            for (const theme of everyTheme()) {
                const v = themeVars(theme, appearance);
                expect(
                    contrastRatio(v[fg], v[bg as string]),
                    `${theme.preset} hue ${theme.hue} ${theme.intensity} ${theme.contrast} ${theme.tint}`,
                ).toBeGreaterThanOrEqual(min as number);
            }
        });

        it('high contrast raises border and secondary text contrast', () => {
            const std = themeVars(DEFAULT_THEME, appearance);
            const hi = themeVars({ ...DEFAULT_THEME, contrast: 'high' }, appearance);
            expect(contrastRatio(hi.border, hi.card)).toBeGreaterThan(contrastRatio(std.border, std.card));
            expect(contrastRatio(hi['muted-foreground'], hi.card)).toBeGreaterThan(
                contrastRatio(std['muted-foreground'], std.card),
            );
        });
    },
);

describe('theme settings', () => {
    it('presets set the colour inputs; edits make it custom', () => {
        const ocean = applyPreset(DEFAULT_THEME, 'ocean');
        expect(ocean).toMatchObject({ preset: 'ocean', hue: 250 });
        expect(customize(ocean, { hue: 200 })).toMatchObject({ preset: 'custom', hue: 200 });
    });

    it('glow and topography map to strengths', () => {
        expect(themeVars({ ...DEFAULT_THEME, glow: 'off' })['glow-strength']).toBe('0');
        expect(themeVars({ ...DEFAULT_THEME, topography: 'visible' })['topo-strength']).toBe('1');
    });

    it('scales component halos from the soft glow, worked out beside the strength', () => {
        expect(themeVars(DEFAULT_THEME, 'dark')['glow-k']).toBe('calc(var(--glow-strength) / 0.55)');
        expect(themeVars(DEFAULT_THEME, 'light')['glow-k']).toBe('calc(var(--glow-strength) / 0.4)');
    });

    it('normalizes missing, invalid or out-of-range values', () => {
        expect(normalizeTheme(undefined)).toEqual(DEFAULT_THEME);
        expect(normalizeTheme({ hue: 725.4, intensity: 'neon', preset: 'evil', glow: 'bright' })).toEqual({
            ...DEFAULT_THEME,
            hue: 5,
            glow: 'bright',
        });
    });

    it("the stylesheet ships the default theme's values, dark and light", () => {
        const css = readFileSync('packages/variables.css', 'utf8');
        const [dark, light] = css.split(":is(.light, [data-theme='light'])");
        for (const [k, v] of Object.entries(themeVars(DEFAULT_THEME, 'dark'))) expect(dark).toContain(`--${k}: ${v};`);
        for (const [k, v] of Object.entries(themeVars(DEFAULT_THEME, 'light')))
            expect(light).toContain(`--${k}: ${v};`);
    });

    it('applies to an element and resets', () => {
        const el = document.createElement('div');
        applyTheme(applyPreset(DEFAULT_THEME, 'teal'), { target: el });
        expect(el.style.getPropertyValue('--primary')).toBe(themeVars(applyPreset(DEFAULT_THEME, 'teal')).primary);
        resetTheme(el);
        expect(el.style.getPropertyValue('--primary')).toBe('');
    });

    it('marks nothing when re-applied with the same values, or while the wave has transitions off', () => {
        const root = document.documentElement;
        applyTheme(DEFAULT_THEME);
        const watch = new MutationObserver(() => {});
        watch.observe(root, { attributes: true, attributeFilter: ['data-zen-theme-applying'] });
        applyTheme(DEFAULT_THEME);
        root.classList.add('zen-theme-waving');
        applyTheme(DEFAULT_THEME, { appearance: 'light' });
        root.classList.remove('zen-theme-waving');
        expect(watch.takeRecords()).toEqual([]);
        watch.disconnect();
        expect(root.style.getPropertyValue('--background')).toBe(themeVars(DEFAULT_THEME, 'light').background);
        resetTheme();
    });

    it('applies with transitions off, marked without touching the class an app may watch', async () => {
        const root = document.documentElement;
        const marked: boolean[] = [];
        const setProperty = root.style.setProperty.bind(root.style);
        root.style.setProperty = (...args) => {
            marked.push(root.hasAttribute('data-zen-theme-applying'));
            setProperty(...args);
        };
        // An app re-applying its theme whenever <html>'s class changes.
        let applied = 0;
        const watch = new MutationObserver(() => {
            // Capped, so a loop fails the test instead of hanging it.
            if (++applied > 3) return watch.disconnect();
            applyTheme(DEFAULT_THEME, { appearance: root.classList.contains('light') ? 'light' : 'dark' });
        });
        watch.observe(root, { attributes: true, attributeFilter: ['class'] });
        root.classList.add('light');
        await new Promise((resolve) => setTimeout(resolve));
        watch.disconnect();
        delete (root.style as Partial<CSSStyleDeclaration>).setProperty;
        root.classList.remove('light');
        resetTheme();
        expect(applied).toBe(1);
        expect(marked.length).toBeGreaterThan(0);
        expect(marked.every(Boolean)).toBe(true);
        expect(root.hasAttribute('data-zen-theme-applying')).toBe(false);
    });
});
