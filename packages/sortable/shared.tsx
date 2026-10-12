import { useMessages } from '@zen/locale-provider';
import { cx } from '@zen/utils/cx';
import { reducedMotion } from '@zen/utils/motion';
import { Slot } from '@zen/utils/slot';
import {
    ComponentProps,
    createContext,
    KeyboardEvent,
    PointerEvent,
    RefObject,
    useContext,
    useEffect,
    useState,
} from 'react';
import { createPortal } from 'react-dom';

const SETTLE: KeyframeAnimationOptions = { duration: 220, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' };
/** Within this far of the scroller's edge, a drag scrolls it, faster nearer the edge. */
const EDGE = 48;

export interface SortableContextValue {
    grab: (e: PointerEvent<HTMLElement>, id: string) => void;
    key: (e: KeyboardEvent<HTMLElement>, id: string, label: string) => void;
    lifted: string | null;
}

export const SortableContext = createContext<SortableContextValue | null>(null);

function useSortable(part: string) {
    const ctx = useContext(SortableContext);
    if (!ctx) throw new Error(`<${part}> must be inside <SortableList> or <SortableTree>`);
    return ctx;
}

/** What moves an item on screen: a table row's cells (moving the row would leave a sticky cell behind), or the item. */
const movers = (el: HTMLElement): HTMLElement[] => (el instanceof HTMLTableRowElement ? [...el.cells] : [el]);

/** Offsets an item `dy` down (0: back in place). */
export function shift(el: HTMLElement, dy: number) {
    for (const m of movers(el)) m.style.translate = dy ? `0 ${dy}px` : '';
}

/** Where an item is on screen, drag offset included. */
const topOf = (el: HTMLElement) => movers(el)[0]?.getBoundingClientRect().top ?? el.getBoundingClientRect().top;

/** Each item's place on screen, by id, to move them from after a change. */
export const topsOf = (els: readonly HTMLElement[]) => new Map(els.map((el) => [el.dataset.sortableId!, topOf(el)]));

/** Moves each item from where it was (`was`) to where it is now, dropping any drag offset. */
export function settle(els: readonly HTMLElement[], was: Map<string, number>) {
    for (const el of els) {
        const parts = movers(el);
        for (const m of parts) m.style.removeProperty('translate');
        // It settles from where it was dropped, whatever else would move it (TableBody slides reordered rows).
        for (const m of [el, ...parts]) for (const a of m.getAnimations?.() ?? []) a.cancel();
        const from = was.get(el.dataset.sortableId!);
        const by = from === undefined ? 0 : from - el.getBoundingClientRect().top;
        if (by && !reducedMotion()) for (const m of parts) m.animate?.({ translate: [`0 ${by}px`, '0 0'] }, SETTLE);
    }
}

/**
 * Scrolls `scroller` while the pointer (at `y`) is near its edge, calling
 * `moved` as the content moves under it. Returns a function to call on each
 * pointer move, and one to stop.
 */
export function edgeScroll(scroller: HTMLElement, moved: () => void) {
    let y = 0;
    let frame = 0;
    const step = () => {
        frame = 0;
        const box =
            scroller === document.scrollingElement ? { top: 0, bottom: innerHeight } : scroller.getBoundingClientRect();
        const speed = y < box.top + EDGE ? -(box.top + EDGE - y) : y > box.bottom - EDGE ? y - (box.bottom - EDGE) : 0;
        if (!speed) return;
        scroller.scrollTop += speed / 3;
        moved();
        frame = requestAnimationFrame(step);
    };
    return {
        at: (pointerY: number) => {
            y = pointerY;
            frame ||= requestAnimationFrame(step);
        },
        stop: () => cancelAnimationFrame(frame),
    };
}

/**
 * Says what happens, from outside the list (a span can't go in a table), but
 * inside a modal dialog it's in, or it wouldn't be heard. Also where a drag's
 * drop line goes.
 */
export function useAnnouncer(root: RefObject<HTMLElement | null>) {
    const [said, say] = useState('');
    const [host, setHost] = useState<Element | null>(null);
    // Once, on the page: the ref is set by then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => setHost(root.current?.closest('dialog') ?? document.body), []);
    const region =
        host &&
        createPortal(
            <span aria-live="assertive" className="sr-only">
                {said}
            </span>,
            host,
        );
    return { say, region, host };
}

/** One item in a SortableList or SortableTree; give it the `id` it has in the list's value. With `asChild`, your own element (a TableRow). */
export function SortableItem({ id, label, asChild, className, ...rest }: SortableItemProps) {
    const { lifted } = useSortable('SortableItem');
    const Item = asChild ? (Slot as unknown as 'li') : 'li';
    return (
        <Item
            data-sortable-id={id}
            data-sortable-label={label}
            data-lifted={lifted === id || undefined}
            className={cx(
                // Lifted, it's a card of its own, covering the items it passes over. Not a table row: its cells move instead.
                'zen__sortable-item transition-[box-shadow,scale,background-color] duration-200 [&:not(tr)]:relative',
                '[&:not(tr)]:data-dragging:bg-card [&:not(tr)]:data-dragging:z-10 [&:not(tr)]:data-dragging:rounded-xl [&:not(tr)]:data-dragging:scale-[1.02] [&:not(tr)]:data-dragging:shadow-[0_0_0_1px_oklch(var(--tint)/0.08),0_12px_32px_-12px_oklch(0_0_0/0.6)]',
                '[&:not(tr)]:data-lifted:bg-card [&:not(tr)]:data-lifted:z-10 [&:not(tr)]:data-lifted:rounded-xl [&:not(tr)]:data-lifted:shadow-[0_0_0_2px_oklch(var(--primary)/0.6)]',
                // Carried along under the dragged one (a tree); lit when it's where a dragged one would go.
                '[&:not(tr)]:data-carried:z-10 [&:not(tr)]:data-carried:bg-card data-drop-target:bg-primary/[0.07] [&[data-drop-target]>td]:[background-image:linear-gradient(oklch(var(--primary)/0.09),oklch(var(--primary)/0.09))]',
                // A table row's cells: frosted as they pass over the other rows, the picked-up one ringed.
                '[&:is([data-dragging],[data-carried])>td]:z-20 [&:is([data-dragging],[data-carried])>td]:bg-card/80 [&:is([data-dragging],[data-carried])>td]:glass-blur [&:is([data-dragging],[data-carried])>td:not(.sticky)]:relative',
                '[&[data-lifted]>td]:[background-image:linear-gradient(oklch(var(--primary)/0.09),oklch(var(--primary)/0.09))] [&[data-lifted]>td]:shadow-[inset_0_2px_0_oklch(var(--primary)/0.6),inset_0_-2px_0_oklch(var(--primary)/0.6)]',
                className,
            )}
            {...rest}
        />
    );
}

/**
 * What an item is dragged by: a grip button. `label` names the item ("Rent");
 * the button reads "Reorder Rent". It takes no scroll gestures, so dragging it
 * never scrolls the page.
 */
export function SortableHandle({ id, label, className, children, ...rest }: SortableHandleProps) {
    const { grab, key, lifted } = useSortable('SortableHandle');
    const m = useMessages();
    return (
        <button
            type="button"
            aria-label={m.reorder(label)}
            data-sortable-label={label}
            aria-pressed={lifted === id}
            onPointerDown={(e) => grab(e, id)}
            onKeyDown={(e) => key(e, id, label)}
            className={cx(
                'text-muted-foreground hover:text-foreground grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-md outline-hidden select-none focus-ring active:cursor-grabbing',
                className,
            )}
            {...rest}
        >
            {children ?? (
                <svg aria-hidden viewBox="0 0 16 16" fill="currentColor" className="size-4">
                    {[4, 8, 12].flatMap((cy) =>
                        [5.5, 10.5].map((cx) => <circle key={`${cx}${cy}`} cx={cx} cy={cy} r="1.25" />),
                    )}
                </svg>
            )}
        </button>
    );
}

/** The nearest ancestor that scrolls vertically, or the page. */
export function scrollerOf(el: HTMLElement): HTMLElement {
    for (let p = el.parentElement; p; p = p.parentElement) {
        if (/auto|scroll/.test(getComputedStyle(p).overflowY) && p.scrollHeight > p.clientHeight) return p;
    }
    return (document.scrollingElement as HTMLElement) ?? document.documentElement;
}

export interface SortableItemProps extends ComponentProps<'li'> {
    id: string;
    /** Its name, for one without a SortableHandle (a group others go into), to say "2 of 3 in Food". */
    label?: string;
    /** Put the item's props on your own element (the single child, e.g. a TableRow) instead of an li. */
    asChild?: boolean;
}

export interface SortableHandleProps extends Omit<ComponentProps<'button'>, 'id'> {
    /** The item's id, as in the list's value. */
    id: string;
    /** The item's name, e.g. "Rent". */
    label: string;
}
