import {
    applyPreset,
    applyTheme,
    Badge,
    Button,
    customize,
    DEFAULT_THEME,
    INTENSITIES,
    Input,
    Meter,
    type PresetId,
    PRESETS,
    Segmented,
    Select,
    Slider,
    type ThemeSettings,
    Toggle,
} from '@rinzai/zen';
import { useEffect, useRef, useState } from 'react';

const HUES = `linear-gradient(to right, ${Array.from({ length: 13 }, (_, i) => `oklch(0.72 0.13 ${i * 30})`).join(', ')})`;

/**
 * A few settings make every colour token, readable in dark and light for any
 * hue. Here the theme applies to the preview only (`target`); leave it out to
 * theme the whole page.
 */
export default function ThemeEditor() {
    const [theme, setTheme] = useState<ThemeSettings>(applyPreset(DEFAULT_THEME, 'ocean'));
    const preview = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const root = document.documentElement;
        const apply = () =>
            preview.current &&
            applyTheme(theme, {
                appearance: root.classList.contains('light') ? 'light' : 'dark',
                target: preview.current,
            });
        apply();
        // Follow the page's dark/light switch.
        const watch = new MutationObserver(apply);
        watch.observe(root, { attributes: true, attributeFilter: ['class'] });
        return () => watch.disconnect();
    }, [theme]);

    return (
        <div className="grid w-full max-w-2xl gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-4">
                <Select
                    aria-label="Preset"
                    value={theme.preset === 'custom' ? null : theme.preset}
                    placeholder="Custom"
                    options={PRESETS.map((p) => ({ value: p.id, label: p.label }))}
                    onChange={(id: PresetId) => setTheme((t) => applyPreset(t, id))}
                />
                <Slider
                    aria-label="Hue"
                    min={0}
                    max={359}
                    value={theme.hue}
                    onValueChange={(hue) => setTheme((t) => customize(t, { hue }))}
                    trackBackground={HUES}
                    thumbColor={`oklch(0.72 0.13 ${theme.hue})`}
                    valueText={(v) => `Hue ${v} degrees`}
                />
                <Segmented
                    label="Intensity"
                    value={theme.intensity}
                    onChange={(intensity) => setTheme((t) => customize(t, { intensity }))}
                    options={INTENSITIES.map((i) => ({ value: i, label: i[0].toUpperCase() + i.slice(1) }))}
                />
                <label className="flex items-center justify-between gap-4 text-sm">
                    Tinted greys
                    <Toggle
                        checked={theme.tint === 'tinted'}
                        onChange={(on) => setTheme((t) => customize(t, { tint: on ? 'tinted' : 'neutral' }))}
                        aria-label="Tinted greys"
                    />
                </label>
                <label className="flex items-center justify-between gap-4 text-sm">
                    High contrast
                    <Toggle
                        checked={theme.contrast === 'high'}
                        onChange={(on) => setTheme((t) => ({ ...t, contrast: on ? 'high' : 'standard' }))}
                        aria-label="High contrast"
                    />
                </label>
            </div>

            <div
                ref={preview}
                className="bg-background text-foreground border-tint/10 flex flex-col gap-4 rounded-xl border p-5"
            >
                <div className="flex items-center justify-between">
                    <span className="font-semibold">Groceries</span>
                    <Badge>On track</Badge>
                </div>
                <Meter label="September" value={420} max={600} detail="$420 / $600" hint="$180 left" />
                <Input placeholder="Add a note" />
                <div className="flex gap-2">
                    <Button>Save</Button>
                    <Button variant="outline">Cancel</Button>
                </div>
            </div>
        </div>
    );
}
