import { useMessages } from '@zen/locale-provider';
import { cx } from '@zen/utils/cx';
import { useMergedRefs } from '@zen/utils/refs';
import { Slot } from '@zen/utils/slot';
import { ComponentProps, KeyboardEvent, PointerEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { edgeScroll, scrollerOf, settle, shift, SortableContext, topsOf, useAnnouncer } from './shared';

export { SortableHandle, type SortableHandleProps, SortableItem, type SortableItemProps } from './shared';
export { default as SortableTree, type SortableTreeProps } from './tree';
export { flattenTree, type SortableNode, type SortableRow } from './tree-model';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const move = <T,>(list: readonly T[], from: number, to: number) => {
    const next = [...list];
    next.splice(to, 0, ...next.splice(from, 1));
    return next;
};

/**
 * A list put in order by dragging, e.g. budget categories: drag an item by its
 * SortableHandle and the others make way (a phone taps lightly at each new
 * place); it settles into place when let go.
 * From the keyboard, Space or Enter on a handle picks the item up, the arrow
 * keys move it, Space or Enter drops it and Escape puts it back; each step is
 * announced. `value` is the ids in order; render a SortableItem for each.
 * With `asChild` (and `asChild` on the items), your own elements instead: a
 * TableBody of TableRows, say, one per group, each sorted on its own.
 */
export function SortableList({
    value,
    onValueChange,
    itemHeight,
    onLiftedChange,
    asChild,
    className,
    children,
    ref,
    ...rest
}: SortableListProps) {
    const list = useRef<HTMLUListElement>(null);
    const listRef = useMergedRefs(list, ref);
    const [lifted, setLifted] = useState<string | null>(null);
    const m = useMessages();
    const { say, region } = useAnnouncer(list);
    // Where each item was on screen before a change we made, to move them from there.
    const flip = useRef<Map<string, number> | null>(null);
    const before = useRef<readonly string[] | null>(null);
    // While dragging: places the items again, as rows come and go in a virtualized list.
    const dragging = useRef<(() => void) | null>(null);

    const items = () => [...(list.current?.querySelectorAll<HTMLElement>(':scope > [data-sortable-id]') ?? [])];
    const reorder = (next: string[]) => {
        flip.current = topsOf(items());
        onValueChange(next);
    };

    useIsoLayoutEffect(() => {
        const was = flip.current;
        flip.current = null;
        if (was) settle(items(), was);
        // A keyboard move can take it past the edge of the view.
        if (lifted)
            items()
                .find((el) => el.dataset.sortableId === lifted)
                ?.scrollIntoView?.({ block: 'nearest' });
    }, [value]);
    // Rows a virtualized list rendered just now take their places in the drag.
    useIsoLayoutEffect(() => dragging.current?.());

    const grab = (e: PointerEvent<HTMLElement>, id: string) => {
        if (e.button !== 0 || lifted) return;
        const els = items();
        const from = value.indexOf(id);
        const draggedEl = els.find((el) => el.dataset.sortableId === id);
        if (from < 0 || !draggedEl) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture?.(e.pointerId);
        const scroller = scrollerOf(list.current!);
        const startScroll = scroller.scrollTop;
        const startY = e.clientY;
        const places = new Map(value.map((v, i) => [v, i]));
        // The room the dragged item takes: its height and the gap after it. A virtualized
        // list renders only some of the items, so its rows are placed by their place in `value`.
        let room: number;
        let targetFor: (dy: number) => number;
        if (itemHeight) {
            room = itemHeight;
            targetFor = (dy) => Math.max(0, Math.min(from + Math.trunc(dy / room), value.length - 1));
        } else {
            const rects = els.map((el) => el.getBoundingClientRect());
            const gap = rects.length > 1 ? rects[1].top - rects[0].bottom : 0;
            room = rects[from].height + gap;
            const centres = rects.map((r) => r.top + r.height / 2);
            targetFor = (dy) => {
                const centre = centres[from] + dy;
                let to = from;
                while (to < els.length - 1 && centre > centres[to + 1]) to++;
                while (to > 0 && centre < centres[to - 1]) to--;
                return to;
            };
        }
        let target = from;
        let y = e.clientY;

        list.current!.dataset.sorting = '';
        onLiftedChange?.(id);
        const place = () => {
            const dy = y - startY + scroller.scrollTop - startScroll;
            const was = target;
            target = targetFor(dy);
            // A light tap as it takes a new place, where phones can vibrate.
            if (target !== was) navigator.vibrate?.(5);
            for (const el of items()) {
                const i = places.get(el.dataset.sortableId!);
                if (i === undefined) continue;
                if (i === from) {
                    el.dataset.dragging = '';
                    shift(el, dy);
                    continue;
                }
                shift(el, from < i && i <= target ? -room : target <= i && i < from ? room : 0);
            }
        };
        dragging.current = place;
        // Near the scroller's edge, scroll it, and keep placing as the content moves under the pointer.
        const edge = edgeScroll(scroller, place);
        // On the window: in a virtualized list the handle can be unmounted mid-drag.
        const onMove = (m: globalThis.PointerEvent) => {
            if (m.pointerId !== e.pointerId) return;
            y = m.clientY;
            place();
            edge.at(y);
        };
        const onEnd = (u: globalThis.PointerEvent) => {
            if (u.pointerId !== e.pointerId) return;
            removeEventListener('pointermove', onMove);
            removeEventListener('pointerup', onEnd);
            removeEventListener('pointercancel', onEnd);
            edge.stop();
            dragging.current = null;
            const now = items();
            for (const el of now) delete el.dataset.dragging;
            delete list.current?.dataset.sorting;
            onLiftedChange?.(null);
            if (u.type === 'pointerup' && target !== from) reorder(move(value, from, target));
            // Nothing changes, so the layout effect won't run: settle back here.
            else settle(now, topsOf(now));
        };
        addEventListener('pointermove', onMove);
        addEventListener('pointerup', onEnd);
        addEventListener('pointercancel', onEnd);
    };

    const key = (e: KeyboardEvent<HTMLElement>, id: string, label: string) => {
        const at = value.indexOf(id);
        const of = m.place(at + 1, value.length);
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (lifted === id) {
                setLifted(null);
                before.current = null;
                onLiftedChange?.(null);
                say(m.dropped(label, of));
            } else if (!lifted) {
                setLifted(id);
                before.current = value;
                onLiftedChange?.(id);
                say(m.pickedUp(label, of));
            }
        } else if (lifted === id && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
            e.preventDefault();
            const to = at + (e.key === 'ArrowUp' ? -1 : 1);
            if (to < 0 || to >= value.length) return;
            reorder(move(value, at, to));
            say(m.movedTo(label, m.place(to + 1, value.length)));
        } else if (lifted === id && e.key === 'Escape') {
            e.preventDefault();
            const back = before.current ?? value;
            setLifted(null);
            before.current = null;
            onLiftedChange?.(null);
            if (back !== value) reorder([...back]);
            say(m.putBack(label, m.place(back.indexOf(id) + 1, back.length)));
        }
    };

    const props = { ...rest, ref: listRef };
    return (
        <SortableContext.Provider value={{ grab, key, lifted }}>
            {asChild ? (
                <Slot {...(props as ComponentProps<'a'>)} className={cx('zen__sortable', className)}>
                    {children}
                </Slot>
            ) : (
                <ul {...props} className={cx('zen__sortable relative flex flex-col', className)}>
                    {children}
                </ul>
            )}
            {region}
        </SortableContext.Provider>
    );
}

export interface SortableListProps extends ComponentProps<'ul'> {
    /** The items' ids, in order. */
    value: readonly string[];
    onValueChange: (value: string[]) => void;
    /**
     * For a virtualized list (useVirtualList), its rows' height, gap included:
     * render just the items in view, each placed at its place in `value` times
     * this, and the drag works from `value` instead of the rows on screen.
     */
    itemHeight?: number;
    /**
     * When an item is picked up (by its handle, or from the keyboard), and when it's
     * put down (null). A virtualized list keeps that row rendered meanwhile
     * (useVirtualList's `keep`), so it stays under the pointer as the list scrolls.
     */
    onLiftedChange?: (id: string | null) => void;
    /** Put the list's props on your own element (the single child, e.g. a TableBody) instead of a ul. */
    asChild?: boolean;
}
