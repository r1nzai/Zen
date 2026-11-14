import { Canvas, CanvasItem, type CanvasItemRect, Segmented, SegmentedItem } from '@rinzai/zen';
import { useState } from 'react';

type Mode = 'off' | 'guides' | 'grid';

/** Off: items go where you drop them. Guides (`snap`): edges and centres line up with the surface and each other. Grid (`grid`, here with `snap`): they keep to a 20-unit grid, its dots showing while you drag. */
export default function Snapping() {
    const [mode, setMode] = useState<Mode>('guides');
    const [items, setItems] = useState<CanvasItemRect[]>([
        { id: 'a', x: 20, y: 20, w: 120, h: 70 },
        { id: 'b', x: 210, y: 70, w: 100, h: 100 },
        { id: 'c', x: 330, y: 30, w: 100, h: 40 },
    ]);
    const [selected, setSelected] = useState<string[]>([]);
    return (
        <div className="flex flex-col items-start gap-3">
            <Segmented label="Snapping" value={mode} onValueChange={setMode}>
                <SegmentedItem value="off">Off</SegmentedItem>
                <SegmentedItem value="guides">Guides</SegmentedItem>
                <SegmentedItem value="grid">Grid</SegmentedItem>
            </Segmented>
            <Canvas
                aria-label="Layout"
                width={460}
                height={220}
                snap={mode !== 'off'}
                grid={mode === 'grid' ? 20 : undefined}
                items={items}
                onItemsChange={setItems}
                selected={selected}
                onSelectedChange={setSelected}
            >
                {items.map((item, n) => (
                    <CanvasItem
                        key={item.id}
                        id={item.id}
                        label={`Card ${n + 1}`}
                        className="glass text-muted-foreground grid place-items-center rounded-lg text-sm tabular-nums"
                    >
                        {item.x}, {item.y}
                    </CanvasItem>
                ))}
            </Canvas>
        </div>
    );
}
