import { Card, ColorPanel } from '@rinzai/zen';
import { useState } from 'react';

/** ColorPanel is the picker's panel on its own, for a sidebar or an inspector. `onValueCommit` fires once a change is made, the moment to save. */
export default function Inline() {
    const [color, setColor] = useState('#ef5a7a');
    const [saved, setSaved] = useState(color);
    return (
        <Card className="flex flex-col gap-3 p-4!">
            <ColorPanel value={color} onChange={setColor} onValueCommit={setSaved} />
            <p className="text-muted-foreground mt-0! text-xs">
                Saved: <span className="text-foreground font-mono">{saved}</span>
            </p>
        </Card>
    );
}
