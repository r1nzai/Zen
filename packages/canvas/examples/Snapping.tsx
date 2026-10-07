import { Canvas, CanvasItem, type CanvasItemRect } from '@rinzai/zen';
import { useState } from 'react';

/** With `snap`, items line up with the surface's edges and centre and with each other, a guide showing where. */
export default function Snapping() {
    const [items, setItems] = useState<CanvasItemRect[]>([
        { id: 'a', x: 24, y: 24, w: 120, h: 72 },
        { id: 'b', x: 210, y: 70, w: 96, h: 96 },
        { id: 'c', x: 330, y: 30, w: 100, h: 40 },
    ]);
    const [selected, setSelected] = useState<string | null>(null);
    return (
        <Canvas
            aria-label="Layout"
            width={460}
            height={220}
            snap
            items={items}
            onChange={(id, rect) => setItems((all) => all.map((i) => (i.id === id ? { id, ...rect } : i)))}
            selected={selected}
            onSelect={setSelected}
        >
            {items.map((item, n) => (
                <CanvasItem
                    key={item.id}
                    id={item.id}
                    label={`Card ${n + 1}`}
                    className="glass text-muted-foreground grid place-items-center rounded-lg text-sm"
                >
                    Card {n + 1}
                </CanvasItem>
            ))}
        </Canvas>
    );
}
