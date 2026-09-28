import { Slider } from '@rinzai/zen';
import { useState } from 'react';

/** A custom track (every hue) and thumb (the chosen colour); onValueCommit fires once, when you let go. */
export default function Hue() {
    const [hue, setHue] = useState(295);
    const [saved, setSaved] = useState(295);
    const gradient = `linear-gradient(to right, ${Array.from({ length: 13 }, (_, i) => `oklch(0.72 0.13 ${i * 30})`).join(', ')})`;
    return (
        <div className="flex w-72 flex-col gap-2">
            <Slider
                aria-label="Accent hue"
                min={0}
                max={359}
                value={hue}
                onValueChange={setHue}
                onValueCommit={setSaved}
                trackBackground={gradient}
                thumbColor={`oklch(0.72 0.13 ${hue})`}
                valueText={(v) => `Hue ${v} degrees`}
            />
            <p className="text-muted-foreground mt-0! text-xs">Saved: {saved}°</p>
        </div>
    );
}
