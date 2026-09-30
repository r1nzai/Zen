import { RadioCard, RadioCards } from '@rinzai/zen';
import { useState } from 'react';

const PALETTES = [
    { id: 'violet', label: 'Violet', hue: 295 },
    { id: 'ocean', label: 'Ocean', hue: 250 },
    { id: 'teal', label: 'Teal', hue: 195 },
    { id: 'amber', label: 'Amber', hue: 75 },
];

/** Each card shows what it picks; the whole card is the click target, and arrow keys move the choice. */
export default function Default() {
    const [palette, setPalette] = useState('violet');
    return (
        <RadioCards
            label="Palette"
            value={palette}
            onChange={setPalette}
            className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
            {PALETTES.map((p) => (
                <RadioCard key={p.id} value={p.id}>
                    <span
                        aria-hidden
                        className="size-7 shrink-0 rounded-full"
                        style={{
                            background: `oklch(0.72 0.13 ${p.hue})`,
                            boxShadow: `0 0 14px -2px oklch(0.7 0.13 ${p.hue})`,
                        }}
                    />
                    <span className="font-medium">{p.label}</span>
                </RadioCard>
            ))}
        </RadioCards>
    );
}
