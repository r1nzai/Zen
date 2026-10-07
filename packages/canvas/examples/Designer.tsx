import {
    Button,
    Canvas,
    CanvasItem,
    type CanvasItemRect,
    ColorPicker,
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    Kbd,
    SortableHandle,
    SortableItem,
    SortableList,
    cx,
} from '@rinzai/zen';
import { KeyboardEvent, useRef, useState } from 'react';

interface Layer extends CanvasItemRect {
    kind: 'text' | 'bar' | 'image';
    name: string;
    color: string;
}

const W = 640;
const H = 360;

const START: Layer[] = [
    { id: 'scene', kind: 'image', name: 'Backdrop', color: '#1b1630', x: 0, y: 0, w: W, h: H, locked: true },
    { id: 'cam', kind: 'image', name: 'Camera', color: '#7c5cff', x: 404, y: 20, w: 216, h: 122 },
    { id: 'title', kind: 'text', name: 'Title', color: '#ffffff', x: 24, y: 252, w: 300, h: 40 },
    { id: 'goal', kind: 'bar', name: 'Sub goal', color: '#2bb3a3', x: 24, y: 304, w: 300, h: 16 },
];

const NEW: Record<Layer['kind'], Omit<Layer, 'id' | 'x' | 'y'>> = {
    text: { kind: 'text', name: 'Text', color: '#ffffff', w: 200, h: 32 },
    bar: { kind: 'bar', name: 'Bar', color: '#f0a83a', w: 220, h: 14 },
    image: { kind: 'image', name: 'Image', color: '#ef5a7a', w: 120, h: 120 },
};

/**
 * A small overlay designer: a 640×360 scene that fits its width, a layers list whose order is the
 * stacking (drag to reorder), and an inspector for the selected card. `onChangeEnd` gives each change
 * with the items before it, which is all Undo needs. Try `⌘Z`, `⇧⌘Z` and `Delete`.
 */
export default function Designer() {
    const [items, setItems] = useState(START);
    const [selected, setSelected] = useState<string[]>(['title']);
    const [past, setPast] = useState<Layer[][]>([]);
    const [future, setFuture] = useState<Layer[][]>([]);
    const editing = useRef<Layer[] | null>(null);
    const count = useRef(0);

    const remember = (before: Layer[]) => {
        setPast((p) => [...p, before]);
        setFuture([]);
    };
    const commit = (next: Layer[]) => {
        remember(items);
        setItems(next);
    };
    // Live edits (a colour being dragged) become one step of history when they end.
    const live = (next: Layer[]) => {
        editing.current ??= items;
        setItems(next);
    };
    const settle = () => {
        if (editing.current) remember(editing.current);
        editing.current = null;
    };
    const undo = () => {
        if (!past.length) return;
        setFuture((f) => [items, ...f]);
        setItems(past[past.length - 1]);
        setPast((p) => p.slice(0, -1));
    };
    const redo = () => {
        if (!future.length) return;
        setPast((p) => [...p, items]);
        setItems(future[0]);
        setFuture((f) => f.slice(1));
    };
    const add = (kind: Layer['kind']) => {
        const id = `${kind}-${++count.current}`;
        const base = NEW[kind];
        commit([
            ...items,
            { ...base, id, name: `${base.name} ${count.current}`, x: (W - base.w) / 2, y: (H - base.h) / 2 },
        ]);
        setSelected([id]);
    };
    const remove = () => {
        const gone = new Set(selected.filter((id) => !items.find((i) => i.id === id)?.locked));
        if (!gone.size) return;
        commit(items.filter((i) => !gone.has(i.id)));
        setSelected([]);
    };
    const onKeyDown = (e: KeyboardEvent) => {
        const mod = e.metaKey || e.ctrlKey;
        if (mod && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            if (e.shiftKey) redo();
            else undo();
        } else if ((e.key === 'Delete' || e.key === 'Backspace') && (e.target as Element).closest('[data-canvas-id]')) {
            e.preventDefault();
            remove();
        }
    };

    // Top of the stack first; the locked backdrop stays at the bottom.
    const layers = items.filter((i) => !i.locked).reverse();
    const one = selected.length === 1 ? items.find((i) => i.id === selected[0]) : undefined;
    const update = (patch: Partial<Layer>) =>
        one && commit(items.map((i) => (i.id === one.id ? { ...i, ...patch } : i)));
    const field = (key: 'x' | 'y' | 'w' | 'h', max: number) => (
        <InputGroup className="h-9">
            <InputGroupAddon className="w-3 uppercase">{key}</InputGroupAddon>
            <InputGroupInput
                type="number"
                aria-label={{ x: 'X', y: 'Y', w: 'Width', h: 'Height' }[key]}
                value={one?.[key] ?? ''}
                disabled={!one || one.locked}
                min={0}
                max={max}
                onChange={(e) => {
                    const v = Math.round(Number(e.target.value));
                    if (one && Number.isFinite(v))
                        update({ [key]: Math.min(max, Math.max(key === 'w' || key === 'h' ? 8 : 0, v)) });
                }}
                className="tabular-nums"
            />
        </InputGroup>
    );

    return (
        <div className="flex w-full max-w-3xl flex-col gap-4" onKeyDown={onKeyDown}>
            <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => add('text')}>
                    Text
                </Button>
                <Button size="sm" variant="secondary" onClick={() => add('bar')}>
                    Bar
                </Button>
                <Button size="sm" variant="secondary" onClick={() => add('image')}>
                    Image
                </Button>
                <span className="flex-1" />
                <Button size="sm" variant="ghost" onClick={undo} disabled={!past.length}>
                    Undo
                </Button>
                <Button size="sm" variant="ghost" onClick={redo} disabled={!future.length}>
                    Redo
                </Button>
                <Button size="sm" variant="ghost" tone="destructive" onClick={remove} disabled={!selected.length}>
                    Delete
                </Button>
            </div>

            <Canvas
                aria-label="Scene"
                width={W}
                height={H}
                scale="fit"
                snap
                items={items}
                onChange={setItems}
                onChangeEnd={(_, before) => remember([...before])}
                selected={selected}
                onSelect={setSelected}
            >
                {items.map((layer) => (
                    <CanvasItem key={layer.id} id={layer.id} label={layer.name} className="flex items-center">
                        {layer.kind === 'text' && (
                            <span
                                className="truncate font-semibold tracking-tight"
                                style={{ color: layer.color, fontSize: layer.h * 0.72, lineHeight: 1 }}
                            >
                                Live in 5 minutes
                            </span>
                        )}
                        {layer.kind === 'bar' && (
                            <div className="size-full overflow-hidden rounded-full bg-white/10">
                                <div className="h-full w-3/5 rounded-full" style={{ background: layer.color }} />
                            </div>
                        )}
                        {layer.kind === 'image' && (
                            <div
                                className={cx('size-full', !layer.locked && 'rounded-xl')}
                                style={{
                                    background: layer.locked
                                        ? `radial-gradient(ellipse at 20% 0%, ${layer.color}, #0b0a12 70%)`
                                        : `radial-gradient(circle at 30% 25%, color-mix(in oklch, ${layer.color} 70%, white), ${layer.color})`,
                                }}
                            />
                        )}
                    </CanvasItem>
                ))}
            </Canvas>

            <div className="grid gap-4 sm:grid-cols-2">
                <section className="flex flex-col gap-2">
                    <h4 className="text-muted-foreground m-0! text-xs font-medium tracking-widest uppercase">Layers</h4>
                    <SortableList
                        aria-label="Layers"
                        value={layers.map((i) => i.id)}
                        onChange={(order) =>
                            commit([
                                ...items.filter((i) => i.locked),
                                ...[...order].reverse().map((id) => items.find((i) => i.id === id)!),
                            ])
                        }
                    >
                        {layers.map((layer) => (
                            <SortableItem
                                key={layer.id}
                                id={layer.id}
                                className={cx(
                                    'flex items-center gap-1 rounded-lg pr-2',
                                    selected.includes(layer.id) && 'bg-primary/10',
                                )}
                            >
                                <SortableHandle id={layer.id} label={layer.name} />
                                <button
                                    type="button"
                                    onClick={() => setSelected([layer.id])}
                                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-1.5 text-left text-sm outline-hidden"
                                >
                                    <span
                                        aria-hidden
                                        className="size-3 shrink-0 rounded-sm"
                                        style={{ background: layer.color }}
                                    />
                                    <span className="truncate">{layer.name}</span>
                                </button>
                            </SortableItem>
                        ))}
                    </SortableList>
                    {items
                        .filter((i) => i.locked)
                        .map((layer) => (
                            <p
                                key={layer.id}
                                className="text-muted-foreground mt-0! flex items-center gap-2 py-1.5 pl-9 text-sm"
                            >
                                <span
                                    aria-hidden
                                    className="size-3 shrink-0 rounded-sm"
                                    style={{ background: layer.color }}
                                />
                                {layer.name}
                                <span className="ml-auto pr-2 text-xs">Locked</span>
                            </p>
                        ))}
                </section>
                <section className="flex flex-col gap-2">
                    <h4 className="text-muted-foreground m-0! text-xs font-medium tracking-widest uppercase">
                        {one ? one.name : selected.length ? `${selected.length} selected` : 'Nothing selected'}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                        {field('x', W)}
                        {field('y', H)}
                        {field('w', W)}
                        {field('h', H)}
                    </div>
                    <ColorPicker
                        aria-label="Colour"
                        value={one?.color ?? '#000000'}
                        disabled={!one}
                        onChange={(color) => one && live(items.map((i) => (i.id === one.id ? { ...i, color } : i)))}
                        onValueCommit={settle}
                    />
                    <p className="text-muted-foreground mt-0! text-xs">
                        <Kbd>Shift</Kbd> keeps a card's shape as you resize; draw a box to select several.
                    </p>
                </section>
            </div>
        </div>
    );
}
