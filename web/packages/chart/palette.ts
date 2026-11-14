/**
 * Where a chart's colours come from when a series or item doesn't give its own:
 * `chart`, the categorical palette (--chart-1…8, distinct hues); `glow`, shades
 * of the theme's two glow colours, from the first to the second and deepening
 * towards the background, for a chart in the theme's own colours (e.g. parts
 * of one whole).
 */
export type ChartPalette = 'chart' | 'glow';

/**
 * The i-th (0-based) of n colours in the palette: what a chart draws its i-th
 * series or item in, for a legend of your own beside it.
 */
export function paletteColor(palette: ChartPalette, i: number, n: number): string {
    if (palette === 'chart') return `var(--chart-${Math.min(i + 1, 8)})`;
    const t = n <= 1 ? 0 : i / (n - 1);
    const hue = `color-mix(in oklch, oklch(var(--glow)), oklch(var(--glow-2)) ${Math.round(t * 100)}%)`;
    return `color-mix(in oklch, ${hue}, oklch(var(--background)) ${Math.round(t * 45)}%)`;
}
