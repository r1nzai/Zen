import { Button, Canvas, CanvasItem, type CanvasItemRect } from '@rinzai/zen';
import { useState } from 'react';

const START: CanvasItemRect[] = [
    { id: 'backdrop', x: 0, y: 0, w: 400, h: 120, locked: true },
    { id: 'avatar', x: 12, y: 12, w: 96, h: 96 },
    { id: 'title', x: 124, y: 20, w: 240, h: 36 },
    { id: 'goal', x: 124, y: 72, w: 240, h: 18 },
];

/**
 * A 400×120 stream overlay that fills the width it's given (`scale="fit"`); positions stay in the
 * design's own pixels. Drag a card or pull a handle (Shift keeps its shape, Escape puts it back), or
 * draw a box to move several. The backdrop is `locked`. `onChangeEnd` keeps the history for Undo.
 */
export default function Overlay() {
    const [items, setItems] = useState(START);
    const [selected, setSelected] = useState<string[]>(['title']);
    const [history, setHistory] = useState<(readonly CanvasItemRect[])[]>([]);
    const one = selected.length === 1 ? items.find((i) => i.id === selected[0]) : undefined;
    return (
        <div className="flex w-full max-w-xl flex-col gap-3">
            <Canvas
                aria-label="Overlay"
                width={400}
                height={120}
                scale="fit"
                snap
                items={items}
                onChange={setItems}
                onChangeEnd={(_, before) => setHistory((h) => [...h, before])}
                selected={selected}
                onSelect={setSelected}
            >
                <CanvasItem
                    id="backdrop"
                    label="Backdrop"
                    className="rounded-lg bg-[linear-gradient(120deg,oklch(var(--primary)/0.12),transparent_60%)]"
                />
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
            <div className="flex items-center justify-between gap-3">
                <p className="text-muted-foreground mt-0! text-xs tabular-nums">
                    {one
                        ? `${one.id}: ${one.x}, ${one.y} · ${one.w} × ${one.h}`
                        : selected.length
                          ? `${selected.length} selected`
                          : 'Nothing selected'}
                </p>
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={!history.length}
                    onClick={() => {
                        setItems([...history[history.length - 1]]);
                        setHistory((h) => h.slice(0, -1));
                    }}
                >
                    Undo
                </Button>
            </div>
        </div>
    );
}
