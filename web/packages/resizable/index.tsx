import { useMessages } from '@zen/locale-provider';
import { cx } from '@zen/utils/cx';
import { readingKey } from '@zen/utils/direction';
import { useMergedRefs } from '@zen/utils/refs';
import {
    ComponentProps,
    createContext,
    KeyboardEvent,
    PointerEvent,
    useContext,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

interface PanelSpec {
    defaultSize?: number;
    minSize: number;
    maxSize: number;
}

interface GroupContextValue {
    orientation: 'horizontal' | 'vertical';
    sizes: Record<string, number>;
    specs: Record<string, PanelSpec>;
    register: (id: string, spec: PanelSpec) => () => void;
    /** Moves the boundary between two neighbouring panels so the first is `size` (as near as their limits allow). */
    resize: (before: string, after: string, size: number) => void;
    setDragging: (dragging: boolean) => void;
}

const GroupContext = createContext<GroupContextValue | null>(null);

function useGroup(part: string) {
    const ctx = useContext(GroupContext);
    if (!ctx) throw new Error(`<${part}> must be inside <ResizablePanelGroup>`);
    return ctx;
}

const PANEL = '[data-zen-panel]';
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/**
 * Panels side by side (or stacked, `orientation="vertical"`) with handles
 * between them to drag, or to focus and move with the arrow keys. Sizes are
 * percentages of the group; `onLayout` reports them all after each change,
 * e.g. to keep for next time as the panels' `defaultSize`. Groups nest.
 */
export default function ResizablePanelGroup({
    orientation = 'horizontal',
    onLayout,
    ref,
    className,
    ...rest
}: ResizablePanelGroupProps) {
    const own = useRef<HTMLDivElement>(null);
    const refs = useMergedRefs(own, ref);
    const [specs, setSpecs] = useState<Record<string, PanelSpec>>({});
    const [sizes, setSizeState] = useState<Record<string, number>>({});
    // Read by a drag in progress, which outlives the render it started in.
    const latest = useRef(sizes);
    const setSizes = (next: Record<string, number>) => {
        latest.current = next;
        setSizeState(next);
    };
    const [dragging, setDragging] = useState(false);

    const ordered = () =>
        Array.from(own.current?.querySelectorAll<HTMLElement>(`:scope > ${PANEL}`) ?? [], (el) => el.dataset.zenPanel!);

    // Sizes for panels that don't have one yet: what's left over, shared out; all scaled to fill the group.
    useIsoLayoutEffect(() => {
        const ids = ordered();
        if (ids.some((id) => !specs[id])) return; // they register in a moment
        const known = (id: string) => latest.current[id] ?? specs[id]?.defaultSize;
        const unsized = ids.filter((id) => known(id) === undefined);
        const taken = ids.reduce((sum, id) => sum + (known(id) ?? 0), 0);
        const share = unsized.length ? Math.max(0, 100 - taken) / unsized.length : 0;
        const next: Record<string, number> = Object.fromEntries(ids.map((id) => [id, known(id) ?? share]));
        const total = ids.reduce((sum, id) => sum + next[id], 0) || 1;
        for (const id of ids) next[id] = (next[id] * 100) / total;
        setSizes(next);
    }, [specs]);

    const value: GroupContextValue = {
        orientation,
        sizes,
        specs,
        register: (id, spec) => {
            setSpecs((all) => ({ ...all, [id]: spec }));
            return () =>
                setSpecs((all) => {
                    const { [id]: _, ...rest } = all;
                    return rest;
                });
        },
        resize: (before, after, size) => {
            const a = specs[before];
            const b = specs[after];
            if (!a || !b) return;
            const current = latest.current;
            const pair = current[before] + current[after];
            const first = clamp(size, Math.max(a.minSize, pair - b.maxSize), Math.min(a.maxSize, pair - b.minSize));
            if (first === current[before]) return;
            const next = { ...current, [before]: first, [after]: pair - first };
            setSizes(next);
            onLayout?.(ordered().map((id) => next[id]));
        },
        setDragging,
    };

    return (
        <GroupContext.Provider value={value}>
            <div
                {...rest}
                ref={refs}
                data-orientation={orientation}
                data-dragging={dragging || undefined}
                className={cx(
                    'zen__resizable flex size-full',
                    orientation === 'vertical' && 'flex-col',
                    dragging && 'select-none',
                    className,
                )}
            />
        </GroupContext.Provider>
    );
}

/** One panel: `defaultSize` is a percentage of the group (those without one share what's left); `minSize` and `maxSize` bound it. */
export function ResizablePanel({
    defaultSize,
    minSize = 0,
    maxSize = 100,
    id: idProp,
    className,
    style,
    ...rest
}: ResizablePanelProps) {
    const group = useGroup('ResizablePanel');
    const ownId = useId();
    const id = idProp ?? ownId;
    const { register } = group;
    useIsoLayoutEffect(() => register(id, { defaultSize, minSize, maxSize }), [id, defaultSize, minSize, maxSize]);
    // Before the group has measured (on the server), a panel without a size takes an equal share.
    const size = group.sizes[id] ?? defaultSize ?? 1;
    return (
        <div
            {...rest}
            id={id}
            data-zen-panel={id}
            style={{ flex: `${size} 1 0px`, ...style }}
            className={cx('min-h-0 min-w-0 overflow-hidden', className)}
        />
    );
}

/** How far an arrow key moves a handle, in percent. */
const STEP = 5;

/**
 * The boundary between two panels: a hairline that lights up while it's
 * dragged, hovered or focused, with a wider grip than it looks. Arrow keys move
 * it, Home and End take the panel before it to its smallest and largest.
 */
export function ResizableHandle({ ref: refProp, className, onPointerDown, onKeyDown, ...rest }: ComponentProps<'div'>) {
    const m = useMessages();
    const group = useGroup('ResizableHandle');
    const ref = useRef<HTMLDivElement>(null);
    const refs = useMergedRefs(ref, refProp);
    const [neighbours, setNeighbours] = useState<[string, string] | null>(null);
    const [active, setActive] = useState(false);
    const horizontal = group.orientation === 'horizontal';

    // Its neighbours are whichever panels are either side of it on the page.
    useIsoLayoutEffect(() => {
        const el = ref.current;
        const before = el?.previousElementSibling?.closest<HTMLElement>(PANEL)?.dataset.zenPanel;
        const after = el?.nextElementSibling?.closest<HTMLElement>(PANEL)?.dataset.zenPanel;
        setNeighbours((now) =>
            !before || !after ? null : now?.[0] === before && now[1] === after ? now : [before, after],
        );
    });

    const [before, after] = neighbours ?? [];
    const size = before ? group.sizes[before] : undefined;
    const spec = before ? group.specs[before] : undefined;

    const drag = (e: PointerEvent<HTMLDivElement>) => {
        onPointerDown?.(e);
        if (e.defaultPrevented || e.button !== 0 || !before || !after || size === undefined) return;
        e.preventDefault();
        const handle = e.currentTarget;
        const [a, b] = [handle.previousElementSibling as HTMLElement, handle.nextElementSibling as HTMLElement];
        const pair = size + group.sizes[after];
        const length = horizontal ? a.offsetWidth + b.offsetWidth : a.offsetHeight + b.offsetHeight;
        const perPx = pair / (length || 1);
        // Leftwards is forwards in right-to-left text.
        const flip = horizontal && getComputedStyle(handle).direction === 'rtl' ? -1 : 1;
        const from = horizontal ? e.clientX : e.clientY;
        handle.setPointerCapture(e.pointerId);
        handle.focus({ preventScroll: true });
        setActive(true);
        group.setDragging(true);
        const move = (m: globalThis.PointerEvent) =>
            group.resize(before, after, size + ((horizontal ? m.clientX : m.clientY) - from) * perPx * flip);
        const end = () => {
            setActive(false);
            group.setDragging(false);
            handle.removeEventListener('pointermove', move);
            handle.removeEventListener('pointerup', end);
            handle.removeEventListener('pointercancel', end);
        };
        handle.addEventListener('pointermove', move);
        handle.addEventListener('pointerup', end);
        handle.addEventListener('pointercancel', end);
    };

    const keys = (e: KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(e);
        if (e.defaultPrevented || !before || !after || size === undefined || !spec) return;
        const key = horizontal ? readingKey(e.key, e.currentTarget) : e.key;
        const target = {
            [horizontal ? 'ArrowLeft' : 'ArrowUp']: size - STEP,
            [horizontal ? 'ArrowRight' : 'ArrowDown']: size + STEP,
            Home: spec.minSize,
            End: spec.maxSize,
        }[key];
        if (target === undefined) return;
        e.preventDefault();
        group.resize(before, after, target);
    };

    return (
        <div
            role="separator"
            aria-label={m.resize}
            tabIndex={0}
            {...rest}
            ref={refs}
            aria-orientation={horizontal ? 'vertical' : 'horizontal'}
            aria-controls={before}
            aria-valuenow={size === undefined ? undefined : Math.round(size)}
            aria-valuemin={spec?.minSize}
            aria-valuemax={spec?.maxSize}
            data-active={active || undefined}
            onPointerDown={drag}
            onKeyDown={keys}
            className={cx(
                'group/handle relative z-10 flex shrink-0 touch-none items-center justify-center outline-hidden',
                // The grip: wider than the line.
                horizontal
                    ? 'w-px cursor-col-resize before:absolute before:inset-y-0 before:-inset-x-2'
                    : 'h-px cursor-row-resize before:absolute before:inset-x-0 before:-inset-y-2',
                className,
            )}
        >
            <span
                aria-hidden
                className={cx(
                    'bg-tint/[0.09] pointer-events-none absolute transition-[background-color,box-shadow,width,height] duration-200',
                    horizontal ? 'inset-y-0 w-px' : 'inset-x-0 h-px',
                    'group-hover/handle:bg-primary/60 group-focus-visible/handle:bg-primary group-data-active/handle:bg-primary',
                    'group-focus-visible/handle:shadow-[0_0_12px_oklch(var(--glow)/calc(0.8*var(--glow-k)))] group-data-active/handle:shadow-[0_0_12px_oklch(var(--glow)/calc(0.8*var(--glow-k)))]',
                    horizontal
                        ? 'group-focus-visible/handle:w-0.5 group-data-active/handle:w-0.5'
                        : 'group-focus-visible/handle:h-0.5 group-data-active/handle:h-0.5',
                )}
            />
        </div>
    );
}

export interface ResizablePanelGroupProps extends ComponentProps<'div'> {
    /** Side by side (default), or stacked. */
    orientation?: 'horizontal' | 'vertical';
    /** Every panel's size, in percent and in order, after each change. */
    onLayout?: (sizes: number[]) => void;
}

export interface ResizablePanelProps extends ComponentProps<'div'> {
    /** Its share of the group, in percent. */
    defaultSize?: number;
    minSize?: number;
    maxSize?: number;
}
