import { cx } from '@zen/utils/cx';
import {
    ComponentProps,
    createContext,
    CSSProperties,
    KeyboardEvent,
    PointerEvent,
    useContext,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

import {
    boundsOf,
    type CanvasGuide,
    type CanvasHandle,
    type CanvasRect,
    intersects,
    moveRect,
    resizeRect,
    type SnapOptions,
} from './geometry';

export type { CanvasRect } from './geometry';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
/** How far (screen px) a press moves before it's a drag, so a click with a shaky hand moves nothing. */
const SLOP = 3;
/** Presses on these inside an item use them, not drag the item. */
const INTERACTIVE =
    'input, textarea, select, button, a[href], [contenteditable=""], [contenteditable="true"], [data-canvas-no-drag]';
const HANDLES: CanvasHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
const HANDLE_PLACE: Record<CanvasHandle, string> = {
    nw: 'left-0 top-0 cursor-nwse-resize',
    n: 'left-1/2 top-0 cursor-ns-resize',
    ne: 'left-full top-0 cursor-nesw-resize',
    e: 'left-full top-1/2 cursor-ew-resize',
    se: 'left-full top-full cursor-nwse-resize',
    s: 'left-1/2 top-full cursor-ns-resize',
    sw: 'left-0 top-full cursor-nesw-resize',
    w: 'left-0 top-1/2 cursor-ew-resize',
};
const ARROWS: Record<string, [number, number]> = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
};

const sameRect = (a: CanvasRect, b: CanvasRect) => a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;
const sameIds = (a: readonly string[], b: readonly string[]) =>
    a.length === b.length && a.every((id, i) => id === b[i]);

interface CanvasContextValue {
    item: (id: string) => CanvasItemRect | undefined;
    selected: readonly string[];
    grab: (e: PointerEvent<HTMLElement>, id: string, label: string, handle?: CanvasHandle) => void;
    key: (e: KeyboardEvent<HTMLElement>, id: string, label: string) => void;
    focus: (id: string) => void;
    hintId: string;
}

const CanvasContext = createContext<CanvasContextValue | null>(null);

/**
 * A fixed-size surface where items sit anywhere, such as the cards of a
 * stream overlay or a slide. Drag an item to move it, and the handles of the
 * selected one to resize it (Shift keeps its shape); Escape mid-drag puts it
 * back. Shift- or Cmd-click, or drag a box on empty space, to select several
 * and move them together. From the keyboard, Tab reaches each item, the arrow
 * keys move the selection (Shift by 10), Alt and the arrow keys resize, Cmd or
 * Ctrl+A selects all, and Escape deselects; each change is announced.
 *
 * Items stay on the surface; with `snap` they line up with its edges and
 * centre and with each other, and with `grid` they keep to a grid. `scale`
 * shows the design larger or smaller, or `"fit"` fills the width it's given.
 * `onChange` gets the items with every step of a change; `onChangeEnd`, once
 * it's made, with the items before it, for undo or saving.
 */
export function Canvas<T extends CanvasItemRect>({
    width,
    height,
    scale = 1,
    items,
    onChange,
    onChangeEnd,
    selected = [],
    onSelect,
    minSize = 8,
    snap = false,
    grid,
    className,
    style,
    children,
    onPointerDown,
    ...rest
}: CanvasProps<T>) {
    const outer = useRef<HTMLDivElement>(null);
    const focusing = useRef(false);
    const [fitScale, setFitScale] = useState<number | null>(null);
    const [guides, setGuides] = useState<CanvasGuide[]>([]);
    const [marquee, setMarquee] = useState<CanvasRect | null>(null);
    const [readout, setReadout] = useState<{ box: CanvasRect; text: string } | null>(null);
    const [dragging, setDragging] = useState(false);
    const [said, say] = useState('');
    const hintId = useId();

    useIsoLayoutEffect(() => {
        const el = outer.current;
        if (scale !== 'fit' || !el) return;
        const measure = () => el.clientWidth && setFitScale(el.clientWidth / width);
        measure();
        if (typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, [scale, width]);
    const k = scale === 'fit' ? (fitScale ?? 1) : scale;

    const byId = new Map(items.map((i) => [i.id, i]));
    const bounds = { width, height, min: minSize };
    const threshold = snap === false ? 0 : (snap === true ? 6 : snap) / k;
    const snapping = (moving: ReadonlySet<string>): SnapOptions => ({
        others: items.filter((i) => !moving.has(i.id)),
        threshold,
        grid,
    });
    const select = (ids: string[]) => {
        if (!sameIds(ids, selected)) onSelect?.(ids);
    };
    const apply = (rects: ReadonlyMap<string, CanvasRect>) =>
        items.map((i) => {
            const r = rects.get(i.id);
            return r ? { ...i, ...r } : i;
        });
    const moveGroup = (starts: readonly CanvasItemRect[], dx: number, dy: number, opts?: SnapOptions) => {
        const box = boundsOf(starts);
        const moved = moveRect(box, dx, dy, bounds, opts);
        const [ox, oy] = [moved.rect.x - box.x, moved.rect.y - box.y];
        const rects = new Map(starts.map((s) => [s.id, { x: s.x + ox, y: s.y + oy, w: s.w, h: s.h }]));
        return { rects, box: moved.rect, guides: moved.guides };
    };
    const tell = (who: string, before: CanvasRect, after: CanvasRect) => {
        if (after.w !== before.w || after.h !== before.h) say(`${who} resized to ${after.w} by ${after.h}.`);
        else if (after.x !== before.x || after.y !== before.y) say(`${who} moved to ${after.x}, ${after.y}.`);
    };
    const nameOf = (starts: readonly CanvasItemRect[], id: string, label: string) =>
        starts.length === 1 && starts[0].id === id ? label : `${starts.length} items`;

    const grab = (e: PointerEvent<HTMLElement>, id: string, label: string, handle?: CanvasHandle) => {
        const item = byId.get(id);
        // A locked item is left to the surface underneath: a press there draws a box or deselects.
        if (e.button !== 0 || !item || (item.locked && !handle)) return;
        const control = (e.target as Element).closest(INTERACTIVE);
        if (!handle && control && control !== e.currentTarget && e.currentTarget.contains(control)) return;
        e.preventDefault();
        e.stopPropagation();
        const additive = e.shiftKey || e.metaKey || e.ctrlKey;
        let sel: string[];
        if (handle) sel = [id];
        else if (additive) sel = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
        else sel = selected.includes(id) ? [...selected] : [id];
        select(sel);
        // Focus too, so the arrow keys work next; not a keyboard selection, so focus() doesn't select.
        focusing.current = true;
        e.currentTarget.closest<HTMLElement>('[data-canvas-id]')?.focus({ preventScroll: true });
        focusing.current = false;
        if (!sel.includes(id)) return;
        const starts = handle ? [item] : sel.flatMap((s) => byId.get(s) ?? []).filter((s) => !s.locked);
        if (!starts.length) return;

        const el = e.currentTarget;
        el.setPointerCapture?.(e.pointerId);
        const moving = new Set(starts.map((s) => s.id));
        const before = items;
        const startBox = boundsOf(starts);
        const who = nameOf(starts, id, label);
        let started = false;
        let next: T[] = [...items];
        let end = startBox;

        const onMove = (m: globalThis.PointerEvent) => {
            if (m.pointerId !== e.pointerId) return;
            const [sx, sy] = [m.clientX - e.clientX, m.clientY - e.clientY];
            if (!started) {
                if (Math.hypot(sx, sy) < SLOP) return;
                started = true;
                setDragging(true);
            }
            const [dx, dy] = [sx / k, sy / k];
            let step: { rects: Map<string, CanvasRect>; box: CanvasRect; guides: CanvasGuide[] };
            if (handle) {
                const r = resizeRect(item, handle, dx, dy, bounds, { keepRatio: m.shiftKey, ...snapping(moving) });
                step = { rects: new Map([[id, r.rect]]), box: r.rect, guides: r.guides };
            } else step = moveGroup(starts, dx, dy, snapping(moving));
            end = step.box;
            next = apply(step.rects);
            onChange(next);
            setGuides(step.guides);
            setReadout({
                box: step.box,
                text: handle ? `${step.box.w} × ${step.box.h}` : `${step.box.x}, ${step.box.y}`,
            });
        };
        const finish = (made: boolean) => {
            el.removeEventListener('pointermove', onMove);
            el.removeEventListener('pointerup', onUp);
            el.removeEventListener('pointercancel', onCancel);
            window.removeEventListener('keydown', onEscape, true);
            if (el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
            setGuides([]);
            setReadout(null);
            setDragging(false);
            if (!started) return;
            if (made) {
                onChangeEnd?.(next, before);
                tell(who, startBox, end);
            } else {
                onChange([...before]);
                say(`${who} put back.`);
            }
        };
        const onUp = (u: globalThis.PointerEvent) => u.pointerId === e.pointerId && finish(true);
        const onCancel = (c: globalThis.PointerEvent) => c.pointerId === e.pointerId && finish(false);
        // The browser's own Escape (deselect, closing a dialog around it) waits: this one puts the drag back.
        const onEscape = (ke: globalThis.KeyboardEvent) => {
            if (ke.key !== 'Escape') return;
            ke.preventDefault();
            ke.stopPropagation();
            finish(false);
        };
        el.addEventListener('pointermove', onMove);
        el.addEventListener('pointerup', onUp);
        el.addEventListener('pointercancel', onCancel);
        window.addEventListener('keydown', onEscape, true);
    };

    /** A press on empty space: a box that selects what it touches, or, without dragging, deselects. */
    const sweep = (e: PointerEvent<HTMLDivElement>) => {
        if (e.button !== 0 || (e.target as Element).closest('[data-canvas-id]:not([data-locked])')) return;
        const el = e.currentTarget;
        const box = el.getBoundingClientRect();
        const at = (p: { clientX: number; clientY: number }) => ({
            x: Math.min(width, Math.max(0, (p.clientX - box.left) / k)),
            y: Math.min(height, Math.max(0, (p.clientY - box.top) / k)),
        });
        const base = e.shiftKey || e.metaKey || e.ctrlKey ? [...selected] : [];
        const from = at(e);
        let started = false;
        let last: readonly string[] = selected;
        el.setPointerCapture?.(e.pointerId);
        const onMove = (m: globalThis.PointerEvent) => {
            if (m.pointerId !== e.pointerId) return;
            if (!started && Math.hypot(m.clientX - e.clientX, m.clientY - e.clientY) < SLOP) return;
            started = true;
            const to = at(m);
            const area = {
                x: Math.min(from.x, to.x),
                y: Math.min(from.y, to.y),
                w: Math.abs(to.x - from.x),
                h: Math.abs(to.y - from.y),
            };
            setMarquee(area);
            const hits = items.filter((i) => !i.locked && intersects(i, area)).map((i) => i.id);
            const ids = [...base, ...hits.filter((h) => !base.includes(h))];
            if (!sameIds(ids, last)) {
                last = ids;
                onSelect?.(ids);
            }
        };
        // Cancelled (on touch, the page took the gesture to scroll): no box, and nothing deselected.
        const onEnd = (u: globalThis.PointerEvent) => {
            if (u.pointerId !== e.pointerId) return;
            el.removeEventListener('pointermove', onMove);
            el.removeEventListener('pointerup', onEnd);
            el.removeEventListener('pointercancel', onEnd);
            setMarquee(null);
            if (u.type === 'pointercancel') return;
            if (started) say(`${last.length} ${last.length === 1 ? 'item' : 'items'} selected.`);
            else if (!base.length) select([]);
        };
        el.addEventListener('pointermove', onMove);
        el.addEventListener('pointerup', onEnd);
        el.addEventListener('pointercancel', onEnd);
    };

    const key = (e: KeyboardEvent<HTMLElement>, id: string, label: string) => {
        const item = byId.get(id);
        if (!item || e.target !== e.currentTarget) return;
        if (e.key === 'Escape') {
            if (!selected.length) return;
            e.preventDefault();
            select([]);
            return;
        }
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
            e.preventDefault();
            const all = items.filter((i) => !i.locked).map((i) => i.id);
            select(all);
            say(`${all.length} items selected.`);
            return;
        }
        const arrow = ARROWS[e.key];
        if (!arrow) return;
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const [dx, dy] = [arrow[0] * step, arrow[1] * step];
        const group = (selected.includes(id) ? selected : [id])
            .flatMap((s) => byId.get(s) ?? [])
            .filter((s) => !s.locked);
        const starts = e.altKey ? group.filter((s) => s.id === id) : group;
        if (!starts.length) return;
        const rects = e.altKey
            ? new Map([[id, resizeRect(item, 'se', dx, dy, bounds).rect]])
            : moveGroup(starts, dx, dy).rects;
        if ([...rects].every(([rid, r]) => sameRect(r, byId.get(rid)!))) return;
        const next = apply(rects);
        onChange(next);
        onChangeEnd?.(next, items);
        tell(nameOf(starts, id, label), boundsOf(starts), boundsOf([...rects.values()]));
    };

    const focus = (id: string) => {
        if (!focusing.current && !selected.includes(id)) select([id]);
    };

    // Below the box, or above it near the bottom; kept inside the surface.
    const readoutAt = readout && {
        left: Math.min(width * k - 28, Math.max(28, (readout.box.x + readout.box.w / 2) * k)),
        top:
            (readout.box.y + readout.box.h) * k + 26 > height * k
                ? Math.max(4, readout.box.y * k - 26)
                : (readout.box.y + readout.box.h) * k + 6,
    };
    const dots = dragging && grid && grid * k >= 6 ? grid * k : 0;

    return (
        <CanvasContext.Provider value={{ item: (id) => byId.get(id), selected, grab, key, focus, hintId }}>
            <div
                ref={outer}
                role="group"
                {...rest}
                onPointerDown={(e) => {
                    onPointerDown?.(e);
                    if (!e.defaultPrevented) sweep(e);
                }}
                style={{
                    ...style,
                    ...(scale === 'fit'
                        ? { width: '100%', aspectRatio: `${width} / ${height}` }
                        : { width: width * k, height: height * k }),
                }}
                className={cx(
                    'zen__canvas bg-tint/[0.03] relative shrink-0 overflow-hidden rounded-lg shadow-[inset_0_0_0_1px_oklch(var(--tint)/0.08)] select-none',
                    className,
                )}
            >
                <div
                    style={{ width, height, scale: String(k), '--canvas-scale': k } as CSSProperties}
                    className={cx(
                        'absolute top-0 left-0 origin-top-left',
                        scale === 'fit' && fitScale === null && 'invisible',
                    )}
                >
                    {children}
                </div>
                <div aria-hidden className="pointer-events-none absolute inset-0">
                    {dots > 0 && (
                        <div
                            data-canvas-grid=""
                            className="absolute inset-0"
                            style={{
                                backgroundImage:
                                    'radial-gradient(circle, oklch(var(--tint) / 0.22) 1px, transparent 1.5px)',
                                backgroundSize: `${dots}px ${dots}px`,
                                backgroundPosition: `${-dots / 2}px ${-dots / 2}px`,
                            }}
                        />
                    )}
                    {guides.map((g) => (
                        <span
                            key={`${g.axis}${g.at}`}
                            data-canvas-guide=""
                            className="bg-primary absolute shadow-[0_0_6px_oklch(var(--glow)/0.8)]"
                            style={
                                g.axis === 'x'
                                    ? { left: g.at * k, top: 0, bottom: 0, width: 1 }
                                    : { top: g.at * k, left: 0, right: 0, height: 1 }
                            }
                        />
                    ))}
                    {marquee && (
                        <span
                            data-canvas-marquee=""
                            className="border-primary/60 bg-primary/10 absolute rounded-sm border"
                            style={{
                                left: marquee.x * k,
                                top: marquee.y * k,
                                width: marquee.w * k,
                                height: marquee.h * k,
                            }}
                        />
                    )}
                    {readoutAt && (
                        <span
                            data-canvas-readout=""
                            className="bg-primary text-primary-foreground absolute -translate-x-1/2 rounded-md px-1.5 py-0.5 text-[11px] leading-4 font-medium whitespace-nowrap tabular-nums shadow-[0_4px_14px_-4px_oklch(var(--glow)/0.7)]"
                            style={readoutAt}
                        >
                            {readout.text}
                        </span>
                    )}
                </div>
            </div>
            <span id={hintId} hidden>
                Arrow keys move the selection, Shift with them by 10. Alt with the arrow keys resizes. Escape deselects.
            </span>
            <span aria-live="assertive" className="sr-only">
                {said}
            </span>
        </CanvasContext.Provider>
    );
}

/**
 * One item on a Canvas, placed where the canvas's `items` say for its `id`;
 * later items sit on top of earlier ones. `label` names it ("Title") in what's
 * announced. Its content is yours: fields and buttons in it work as usual,
 * and pressing them doesn't drag it (nor anything with data-canvas-no-drag).
 */
export function CanvasItem({ id, label, className, style, children, ...rest }: CanvasItemProps) {
    const ctx = useContext(CanvasContext);
    if (!ctx) throw new Error('<CanvasItem> must be inside <Canvas>');
    const item = ctx.item(id);
    if (!item) return null;
    const on = ctx.selected.includes(id);
    const alone = on && ctx.selected.length === 1;
    return (
        <div
            role="group"
            aria-roledescription={item.locked ? 'locked item' : 'movable item'}
            aria-label={label}
            aria-describedby={item.locked ? undefined : ctx.hintId}
            tabIndex={0}
            data-canvas-id={id}
            data-selected={on || undefined}
            data-locked={item.locked || undefined}
            {...rest}
            onFocus={(e) => {
                rest.onFocus?.(e);
                if (e.target === e.currentTarget) ctx.focus(id);
            }}
            onPointerDown={(e) => {
                rest.onPointerDown?.(e);
                ctx.grab(e, id, label);
            }}
            onKeyDown={(e) => {
                rest.onKeyDown?.(e);
                ctx.key(e, id, label);
            }}
            style={{ ...style, left: item.x, top: item.y, width: item.w, height: item.h }}
            className={cx(
                'zen__canvas-item absolute cursor-move touch-none outline-hidden data-locked:cursor-default data-locked:touch-auto',
                '[outline-offset:calc(1px/var(--canvas-scale))]',
                'not-data-selected:hover:outline-solid not-data-selected:hover:outline-[length:calc(1px/var(--canvas-scale))] not-data-selected:hover:outline-[color:oklch(var(--tint)/0.35)]',
                'data-selected:outline-solid data-selected:outline-[length:calc(2px/var(--canvas-scale))] data-selected:outline-[color:oklch(var(--primary)/0.8)]',
                'focus-visible:outline-solid focus-visible:outline-[length:calc(2px/var(--canvas-scale))] focus-visible:outline-[color:oklch(var(--ring)/0.7)]',
                className,
            )}
        >
            {children}
            {alone &&
                !item.locked &&
                HANDLES.map((h) => (
                    <span
                        key={h}
                        aria-hidden
                        data-handle={h}
                        onPointerDown={(e) => ctx.grab(e, id, label, h)}
                        className={cx(
                            'bg-foreground absolute z-10 size-[calc(10px/var(--canvas-scale))] -translate-1/2 rounded-full border-[length:calc(2px/var(--canvas-scale))] border-[color:oklch(var(--primary))] shadow-[0_0_8px_oklch(var(--glow)/0.6)]',
                            // A bigger target than the dot shows, bigger still for fingers.
                            'after:absolute after:-inset-[calc(6px/var(--canvas-scale))] pointer-coarse:after:-inset-[calc(14px/var(--canvas-scale))]',
                            HANDLE_PLACE[h],
                        )}
                    />
                ))}
        </div>
    );
}

export interface CanvasItemRect extends CanvasRect {
    id: string;
    /** Not moved or resized, and presses go through it to the surface (Tab still reaches it): a background, say. */
    locked?: boolean;
}

export interface CanvasProps<T extends CanvasItemRect = CanvasItemRect> extends Omit<
    ComponentProps<'div'>,
    'onChange' | 'onSelect'
> {
    /** The surface's size, in your design's units (px at scale 1). */
    width: number;
    height: number;
    /** How large to show it: 2 shows a 400×120 design 800×240; "fit" fills the width it's given. Positions stay in design units. */
    scale?: number | 'fit';
    /** Where each item is (other fields are kept); render a CanvasItem for each. */
    items: readonly T[];
    /** The items, with every step of a move or resize. */
    onChange: (items: T[]) => void;
    /** The items once a change is made (a drag let go, a key pressed), and as they were before: for undo or saving. */
    onChangeEnd?: (items: T[], before: readonly T[]) => void;
    /** The selected items' ids. */
    selected?: readonly string[];
    onSelect?: (ids: string[]) => void;
    /** Smallest width and height an item can be resized to. */
    minSize?: number;
    /** Line items up with the surface and each other: true, or how close counts, in screen px (true is 6). */
    snap?: boolean | number;
    /** Keep positions and sizes to multiples of this (design units) when no line is in reach. */
    grid?: number;
}

export interface CanvasItemProps extends ComponentProps<'div'> {
    id: string;
    /** The item's name, e.g. "Title", for what's announced. */
    label: string;
}
