import { Canvas, CanvasItem, type CanvasItemRect, Meter, Sparkline, Stat, StatusPill } from '@rinzai/zen';
import { ReactNode, useState } from 'react';

const WIDGETS: Record<string, { label: string; render: () => ReactNode }> = {
    spent: {
        label: 'Spent',
        render: () => (
            <Stat label="Spent" value="$2,742" tone="negative" className="size-full">
                <Sparkline
                    values={[40, 52, 48, 61, 58, 66, 72, 69, 80]}
                    tone="negative"
                    area
                    className="mt-2 h-auto min-h-0 w-full flex-1"
                />
            </Stat>
        ),
    },
    left: {
        label: 'Left to spend',
        render: () => <Stat label="Left to spend" value="$1,258" tone="positive" className="size-full" />,
    },
    budgets: {
        label: 'Budgets',
        render: () => (
            <div className="glass glow-edge flex size-full flex-col gap-4 rounded-xl p-3.5 md:p-4">
                <span className="text-muted-foreground text-2xs tracking-widest uppercase sm:text-xs">Budgets</span>
                <Meter label="Groceries" value={207} max={600} detail="$207 / $600" />
                <Meter label="Dining out" value={170} max={150} detail="$170 / $150" />
                <Meter label="Transport" value={64} max={120} detail="$64 / $120" />
                <Meter label="Bills" value={310} max={340} detail="$310 / $340" />
            </div>
        ),
    },
    balance: {
        label: 'Balance',
        render: () => (
            <Stat label="Balance" value="$18,400" className="size-full">
                <Sparkline
                    values={[12, 13, 13.5, 14, 15.2, 15, 16.4, 17.1, 18.4]}
                    area
                    className="mt-2 h-auto min-h-0 w-full flex-1"
                />
            </Stat>
        ),
    },
};

/**
 * A dashboard you lay out yourself: widgets on a 20-unit `grid`, lining up with each other as you drag
 * (`snap`), with `minSize` so none gets too small. Widgets are any content; here Stat, Meter and
 * Sparkline. `onItemsChangeEnd` is the moment to save the layout.
 */
export default function Dashboard() {
    const [items, setItems] = useState<CanvasItemRect[]>([
        { id: 'spent', x: 0, y: 0, w: 220, h: 140 },
        { id: 'left', x: 240, y: 0, w: 220, h: 140 },
        { id: 'budgets', x: 480, y: 0, w: 240, h: 300 },
        { id: 'balance', x: 0, y: 160, w: 460, h: 140 },
    ]);
    const [selected, setSelected] = useState<string[]>([]);
    const [saves, setSaves] = useState(0);
    return (
        <div className="flex w-full max-w-3xl flex-col gap-3">
            <Canvas
                aria-label="Dashboard"
                width={720}
                height={300}
                scale="fit"
                snap
                grid={20}
                minSize={100}
                items={items}
                onItemsChange={setItems}
                onItemsChangeEnd={() => setSaves((n) => n + 1)}
                selected={selected}
                onSelectedChange={setSelected}
                className="bg-transparent shadow-none"
            >
                {items.map((item) => (
                    <CanvasItem key={item.id} id={item.id} label={WIDGETS[item.id].label} className="rounded-xl">
                        {WIDGETS[item.id].render()}
                    </CanvasItem>
                ))}
            </Canvas>
            <div className="flex justify-end">
                <StatusPill tone={saves ? 'positive' : 'default'} quiet={!saves}>
                    {saves ? `Layout saved (${saves})` : 'Drag a widget, or a handle to resize it'}
                </StatusPill>
            </div>
        </div>
    );
}
