import { Canvas, CanvasItem, type CanvasItemRect } from '@rinzai/zen';
import { useState } from 'react';

/** A 400×120 stream overlay shown at 1.5×: positions stay in the design's own pixels. Drag a card, or pull a handle; Shift keeps its shape. */
export default function Overlay() {
    const [items, setItems] = useState<CanvasItemRect[]>([
        { id: 'avatar', x: 12, y: 12, w: 96, h: 96 },
        { id: 'title', x: 124, y: 20, w: 240, h: 36 },
        { id: 'goal', x: 124, y: 72, w: 240, h: 18 },
    ]);
    const [selected, setSelected] = useState<string | null>('title');
    const at = items.find((i) => i.id === selected);
    return (
        <div className="flex flex-col gap-3">
            <Canvas
                aria-label="Overlay"
                width={400}
                height={120}
                scale={1.5}
                snap
                items={items}
                onChange={(id, rect) => setItems((all) => all.map((i) => (i.id === id ? { id, ...rect } : i)))}
                selected={selected}
                onSelect={setSelected}
            >
                <CanvasItem
                    id="avatar"
                    label="Picture"
                    className="rounded-xl bg-[radial-gradient(circle_at_30%_25%,oklch(var(--glow)/0.9),oklch(var(--primary)/0.5))]"
                />
                <CanvasItem id="title" label="Title" className="flex items-center text-xl font-semibold">
                    Live in 5 minutes
                </CanvasItem>
                <CanvasItem id="goal" label="Goal bar" className="bg-tint/10 overflow-hidden rounded-full">
                    <div className="bg-primary h-full w-3/5 rounded-full" />
                </CanvasItem>
            </Canvas>
            <p className="text-muted-foreground mt-0! text-xs tabular-nums">
                {at ? `${selected}: ${at.x}, ${at.y} · ${at.w} × ${at.h}` : 'Nothing selected'}
            </p>
        </div>
    );
}
