import { cx } from '@zen/utils/cx';
import {
    ComponentProps,
    createContext,
    CSSProperties,
    KeyboardEvent,
    PointerEvent,
    useContext,
    useId,
    useState,
} from 'react';

import { type CanvasGuide, type CanvasHandle, type CanvasRect, moveRect, resizeRect } from './geometry';

export type { CanvasGuide, CanvasRect } from './geometry';

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

interface CanvasContextValue {
    rect: (id: string) => CanvasRect | undefined;
    selected: string | null;
    select: (id: string) => void;
    grab: (e: PointerEvent<HTMLElement>, id: string, label: string, handle?: CanvasHandle) => void;
    key: (e: KeyboardEvent<HTMLElement>, id: string, label: string) => void;
    hintId: string;
}

const CanvasContext = createContext<CanvasContextValue | null>(null);

/**
 * A fixed-size surface where items sit anywhere, such as the cards of a
 * stream overlay or a slide. Drag an item to move it, and the handles of the
 * selected one to resize it (Shift keeps its shape). From the keyboard, Tab
 * reaches each item, the arrow keys move it (Shift by 10), Alt and the arrow
 * keys resize it, and Escape deselects; each change is announced. Items stay
 * on the surface, and with `snap` they line up with its edges and centre and
 * with each other, guides showing. `scale` shows the design larger or smaller.
 */
export function Canvas({
    width,
    height,
    scale = 1,
    items,
    onChange,
    selected = null,
    onSelect,
    minSize = 8,
    snap = false,
    className,
    style,
    children,
    onPointerDown,
    ...rest
}: CanvasProps) {
    const [guides, setGuides] = useState<CanvasGuide[]>([]);
    const [said, say] = useState('');
    const hintId = useId();
    const byId = new Map(items.map((i) => [i.id, i]));
    const bounds = { width, height, min: minSize };
    const threshold = snap === false ? 0 : (snap === true ? 6 : snap) / scale;
    const snapping = (id: string) => (threshold ? { others: items.filter((i) => i.id !== id), threshold } : undefined);
    const put = (id: string, rect: CanvasRect) => {
        const was = byId.get(id);
        if (was && (rect.x !== was.x || rect.y !== was.y || rect.w !== was.w || rect.h !== was.h)) onChange(id, rect);
    };
    const tell = (label: string, from: CanvasRect, to: CanvasRect) => {
        if (to.w !== from.w || to.h !== from.h) say(`${label} resized to ${to.w} by ${to.h}.`);
        else if (to.x !== from.x || to.y !== from.y) say(`${label} moved to ${to.x}, ${to.y}.`);
    };

    const grab = (e: PointerEvent<HTMLElement>, id: string, label: string, handle?: CanvasHandle) => {
        const start = byId.get(id);
        if (e.button !== 0 || !start) return;
        e.preventDefault();
        onSelect?.(id);
        const el = e.currentTarget;
        el.setPointerCapture?.(e.pointerId);
        let last: CanvasRect = start;
        const onMove = (m: globalThis.PointerEvent) => {
            if (m.pointerId !== e.pointerId) return;
            const dx = (m.clientX - e.clientX) / scale;
            const dy = (m.clientY - e.clientY) / scale;
            const next = handle
                ? resizeRect(start, handle, dx, dy, bounds, { keepRatio: m.shiftKey, snap: snapping(id) })
                : moveRect(start, dx, dy, bounds, snapping(id));
            last = next.rect;
            setGuides(next.guides);
            put(id, next.rect);
        };
        const onEnd = (u: globalThis.PointerEvent) => {
            if (u.pointerId !== e.pointerId) return;
            el.removeEventListener('pointermove', onMove);
            el.removeEventListener('pointerup', onEnd);
            el.removeEventListener('pointercancel', onEnd);
            setGuides([]);
            tell(label, start, last);
        };
        el.addEventListener('pointermove', onMove);
        el.addEventListener('pointerup', onEnd);
        el.addEventListener('pointercancel', onEnd);
    };

    const key = (e: KeyboardEvent<HTMLElement>, id: string, label: string) => {
        const start = byId.get(id);
        if (!start || e.target !== e.currentTarget) return;
        if (e.key === 'Escape' && selected === id) {
            e.preventDefault();
            onSelect?.(null);
            return;
        }
        const arrow = ARROWS[e.key];
        if (!arrow) return;
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const [dx, dy] = [arrow[0] * step, arrow[1] * step];
        const { rect } = e.altKey ? resizeRect(start, 'se', dx, dy, bounds) : moveRect(start, dx, dy, bounds);
        put(id, rect);
        tell(label, start, rect);
    };

    return (
        <CanvasContext.Provider
            value={{ rect: (id) => byId.get(id), selected, select: (id) => onSelect?.(id), grab, key, hintId }}
        >
            <div
                role="group"
                {...rest}
                onPointerDown={(e) => {
                    onPointerDown?.(e);
                    if (!(e.target as Element).closest('[data-canvas-id]')) onSelect?.(null);
                }}
                style={{ ...style, width: width * scale, height: height * scale }}
                className={cx(
                    'zen__canvas relative shrink-0 overflow-hidden rounded-lg bg-tint/[0.03] shadow-[inset_0_0_0_1px_oklch(var(--tint)/0.08)]',
                    className,
                )}
            >
                <div
                    style={{ width, height, scale: String(scale), '--canvas-scale': scale } as CSSProperties}
                    className="absolute top-0 left-0 origin-top-left"
                >
                    {children}
                    {guides.map((g) => (
                        <span
                            key={`${g.axis}${g.at}`}
                            aria-hidden
                            className="bg-primary pointer-events-none absolute shadow-[0_0_6px_oklch(var(--glow)/0.8)]"
                            style={
                                g.axis === 'x'
                                    ? { left: g.at, top: 0, bottom: 0, width: `calc(1px / ${scale})` }
                                    : { top: g.at, left: 0, right: 0, height: `calc(1px / ${scale})` }
                            }
                        />
                    ))}
                </div>
            </div>
            <span id={hintId} hidden>
                Arrow keys move it, Shift with them by 10. Alt with the arrow keys resizes it. Escape deselects.
            </span>
            <span aria-live="assertive" className="sr-only">
                {said}
            </span>
        </CanvasContext.Provider>
    );
}

/**
 * One item on a Canvas, placed where the canvas's `items` say for its `id`.
 * `label` names it ("Title") in what's announced. Its content is yours.
 */
export function CanvasItem({ id, label, className, style, children, ...rest }: CanvasItemProps) {
    const ctx = useContext(CanvasContext);
    if (!ctx) throw new Error('<CanvasItem> must be inside <Canvas>');
    const rect = ctx.rect(id);
    if (!rect) return null;
    const on = ctx.selected === id;
    return (
        <div
            role="group"
            aria-roledescription="movable item"
            aria-label={label}
            aria-describedby={ctx.hintId}
            tabIndex={0}
            data-canvas-id={id}
            data-selected={on || undefined}
            {...rest}
            onFocus={(e) => {
                rest.onFocus?.(e);
                if (e.target === e.currentTarget && !on) ctx.select(id);
            }}
            onPointerDown={(e) => ctx.grab(e, id, label)}
            onKeyDown={(e) => {
                rest.onKeyDown?.(e);
                ctx.key(e, id, label);
            }}
            style={{ ...style, left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
            className={cx(
                'zen__canvas-item absolute cursor-move touch-none outline-hidden select-none',
                '[outline-offset:calc(1px/var(--canvas-scale))] data-selected:outline-[length:calc(2px/var(--canvas-scale))] data-selected:outline-solid data-selected:outline-[color:oklch(var(--primary)/0.8)]',
                'focus-visible:outline-[length:calc(2px/var(--canvas-scale))] focus-visible:outline-solid focus-visible:outline-[color:oklch(var(--ring)/0.6)]',
                className,
            )}
        >
            {children}
            {on &&
                HANDLES.map((h) => (
                    <span
                        key={h}
                        aria-hidden
                        data-handle={h}
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            ctx.grab(e, id, label, h);
                        }}
                        className={cx(
                            'bg-foreground absolute z-10 size-[calc(10px/var(--canvas-scale))] -translate-1/2 touch-none rounded-full border-[length:calc(2px/var(--canvas-scale))] border-[color:oklch(var(--primary))] shadow-[0_0_8px_oklch(var(--glow)/0.6)]',
                            // A bigger target for fingers than the dot shows.
                            'after:absolute after:-inset-[calc(8px/var(--canvas-scale))] pointer-coarse:after:-inset-[calc(16px/var(--canvas-scale))]',
                            HANDLE_PLACE[h],
                        )}
                    />
                ))}
        </div>
    );
}

export interface CanvasItemRect extends CanvasRect {
    id: string;
}

export interface CanvasProps extends Omit<ComponentProps<'div'>, 'onChange' | 'onSelect'> {
    /** The surface's size, in your design's units (px at scale 1). */
    width: number;
    height: number;
    /** How large to show it: 2 shows a 400×120 design 800×240. Positions stay in design units. */
    scale?: number;
    /** Where each item is; render a CanvasItem for each. */
    items: readonly CanvasItemRect[];
    /** An item moved or resized, while it happens. */
    onChange: (id: string, rect: CanvasRect) => void;
    /** The selected item's id. */
    selected?: string | null;
    /** An item was pressed or focused, or null: empty space was pressed, or Escape. */
    onSelect?: (id: string | null) => void;
    /** Smallest width and height an item can be resized to. */
    minSize?: number;
    /** Line items up with the surface and each other: true, or how close counts, in screen px (true is 6). */
    snap?: boolean | number;
}

export interface CanvasItemProps extends ComponentProps<'div'> {
    id: string;
    /** The item's name, e.g. "Title", for what's announced. */
    label: string;
}
