import { useMessages } from '@zen/locale-provider';
import { cx } from '@zen/utils/cx';
import { readingKey } from '@zen/utils/direction';
import { useMergedRefs } from '@zen/utils/refs';
import { Slot } from '@zen/utils/slot';
import { ComponentProps, KeyboardEvent, PointerEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { edgeScroll, scrollerOf, settle, shift, SortableContext, topsOf, useAnnouncer } from './shared';
import {
    indexTree,
    insertNode,
    nearestSlot,
    removeNode,
    type SortableNode,
    type TreePlace,
    type TreeSlot,
    treeSlots,
} from './tree-model';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const LINE =
    'pointer-events-none fixed z-50 h-0.5 rounded-full bg-primary shadow-[0_0_10px_oklch(var(--glow)/calc(0.9*var(--glow-k)))] transition-[top,left,width] duration-100 before:absolute before:-top-[3px] before:-start-1 before:size-2 before:rounded-full before:border-2 before:border-primary before:bg-background';

const same = (a: TreePlace, b: TreePlace) => a.parentId === b.parentId && a.index === b.index;

/**
 * Items in groups, and groups in groups, put in order by dragging: an item
 * can go anywhere in its group, into another group (or one open inside it),
 * or under another item. While dragging, a glowing line shows where it will
 * land, set in as deep as it'll go, and the group it would join is lit; drag
 * sideways to go a level in or out. From the keyboard, Space or Enter on a
 * handle picks it up, the up and down arrows move it through every place it
 * can go, left and right a level out or in, Space or Enter drops it and
 * Escape puts it back; each step is announced.
 *
 * `value` is the tree of ids. Render a SortableItem for each row shown, in
 * order (flattenTree lists them, with their depths): what's under a closed
 * one isn't shown, and moves with it. `accepts` says which group takes which
 * item. With `asChild`, your own element (a Table, its rows SortableItems with
 * asChild on TableRows) instead of a ul.
 */
export default function SortableTree({
    value,
    onValueChange,
    accepts,
    indent = 24,
    asChild,
    className,
    children,
    ref,
    ...rest
}: SortableTreeProps) {
    const root = useRef<HTMLUListElement>(null);
    const rootRef = useMergedRefs(root, ref);
    const [lifted, setLifted] = useState<string | null>(null);
    const m = useMessages();
    const { say, region, host } = useAnnouncer(root);
    const flip = useRef<Map<string, number> | null>(null);
    const before = useRef<SortableNode[] | null>(null);

    // Its own rows, not those of a sortable inside it.
    const items = () =>
        [...(root.current?.querySelectorAll<HTMLElement>('[data-sortable-id]') ?? [])].filter(
            (el) => el.parentElement?.closest('.zen__sortable') === root.current,
        );
    const itemFor = (id: string) => items().find((el) => el.dataset.sortableId === id);
    const change = (next: SortableNode[]) => {
        flip.current = topsOf(items());
        onValueChange(next);
    };

    useIsoLayoutEffect(() => {
        const was = flip.current;
        flip.current = null;
        if (was) settle(items(), was);
        // Moved to another part of the page (another TableBody), its handle is a new element: keep the keyboard on it.
        if (lifted) {
            const handle = itemFor(lifted)?.querySelector<HTMLElement>('button[data-sortable-label]');
            if (handle && handle !== document.activeElement) handle.focus();
        }
    }, [value]);

    const nameOf = (id: string) => {
        const el = itemFor(id);
        return (
            el?.dataset.sortableLabel ?? el?.querySelector<HTMLElement>('[data-sortable-label]')?.dataset.sortableLabel
        );
    };
    const placeText = (tree: readonly SortableNode[], id: string) => {
        const at = indexTree(tree).get(id)!;
        const siblings = at.parentId === null ? tree : (findChildren(tree, at.parentId) ?? []);
        const group = at.parentId === null ? undefined : nameOf(at.parentId);
        return group ? m.placeIn(at.index + 1, siblings.length, group) : m.place(at.index + 1, siblings.length);
    };

    /** Where `id` can go: the tree without it, the rows still shown, and every allowed place among them. */
    const plan = (id: string) => {
        const els = items();
        const info = indexTree(value);
        const from = els.findIndex((el) => el.dataset.sortableId === id);
        const depth = info.get(id)!.depth;
        // It carries the rows shown under it.
        let end = from + 1;
        while (end < els.length && info.get(els[end].dataset.sortableId!)!.depth > depth) end++;
        const carried = els.slice(from, end);
        const rows = [...els.slice(0, from), ...els.slice(end)];
        const [tree, node] = removeNode(value, id);
        const slots = treeSlots(
            tree,
            rows.map((el) => ({ id: el.dataset.sortableId! })),
            (parentId) => accepts?.(id, parentId) ?? true,
        );
        return { els, carried, rows, tree, node: node!, slots, depth, place: info.get(id)! };
    };

    const grab = (e: PointerEvent<HTMLElement>, id: string) => {
        if (e.button !== 0 || lifted) return;
        const p = plan(id);
        if (!p.carried.length) return;
        e.preventDefault();
        const handle = e.currentTarget;
        handle.setPointerCapture?.(e.pointerId);
        const scroller = scrollerOf(root.current!);
        const startScroll = scroller.scrollTop;
        const [startX, startY] = [e.clientX, e.clientY];
        const rtl = getComputedStyle(root.current!).direction === 'rtl';
        const rects = p.rows.map((el) => el.getBoundingClientRect());
        const centres = rects.map((r) => r.top + r.height / 2);
        const clip = visibleBox(root.current!);
        const line = document.createElement('div');
        line.className = LINE;
        line.hidden = true;
        (host ?? document.body).append(line);
        let x = startX;
        let y = startY;
        let target: TreeSlot | null = null;
        let lit: HTMLElement | undefined;

        p.carried[0].dataset.dragging = '';
        for (const el of p.carried.slice(1)) el.dataset.carried = '';
        root.current!.dataset.sorting = '';

        const place = () => {
            const scrolled = scroller.scrollTop - startScroll;
            const dy = y - startY + scrolled;
            for (const el of p.carried) shift(el, dy);
            const pointer = y + scrolled;
            const gap = centres.filter((c) => c < pointer).length;
            const wanted = p.depth + Math.round(((x - startX) * (rtl ? -1 : 1)) / indent);
            const was = target;
            target = nearestSlot(p.slots, gap, wanted);
            if (target !== was && (target?.gap !== was?.gap || target?.depth !== was?.depth)) navigator.vibrate?.(5);
            // The line: between the rows, set in as deep as it'll go.
            line.hidden = !target;
            const lighting = target?.parentId
                ? p.rows.find((el) => el.dataset.sortableId === target!.parentId)
                : undefined;
            if (lighting !== lit) {
                if (lit) delete lit.dataset.dropTarget;
                if (lighting) lighting.dataset.dropTarget = '';
                lit = lighting;
            }
            if (!target) return;
            const edge = target.gap < rects.length ? rects[target.gap].top : (rects[rects.length - 1]?.bottom ?? 0);
            const inset = target.depth * indent + 8;
            line.style.top = `${edge - scrolled - 1}px`;
            line.style.left = `${rtl ? clip.left + 8 : clip.left + inset}px`;
            line.style.width = `${Math.max(0, clip.right - clip.left - inset - 8)}px`;
        };
        const edge = edgeScroll(scroller, place);
        const onMove = (mv: globalThis.PointerEvent) => {
            if (mv.pointerId !== e.pointerId) return;
            [x, y] = [mv.clientX, mv.clientY];
            place();
            edge.at(y);
        };
        const onEnd = (u: globalThis.PointerEvent) => {
            if (u.pointerId !== e.pointerId) return;
            handle.removeEventListener('pointermove', onMove);
            handle.removeEventListener('pointerup', onEnd);
            handle.removeEventListener('pointercancel', onEnd);
            edge.stop();
            line.remove();
            if (lit) delete lit.dataset.dropTarget;
            delete p.carried[0].dataset.dragging;
            for (const el of p.carried) delete el.dataset.carried;
            delete root.current?.dataset.sorting;
            if (u.type === 'pointerup' && target && !same(target, p.place)) change(insertNode(p.tree, target, p.node));
            else settle(p.els, topsOf(p.els));
        };
        handle.addEventListener('pointermove', onMove);
        handle.addEventListener('pointerup', onEnd);
        handle.addEventListener('pointercancel', onEnd);
    };

    const key = (e: KeyboardEvent<HTMLElement>, id: string, label: string) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (lifted === id) {
                setLifted(null);
                before.current = null;
                say(m.dropped(label, placeText(value, id)));
            } else if (!lifted) {
                setLifted(id);
                before.current = value as SortableNode[];
                say(m.pickedUp(label, placeText(value, id)));
            }
            return;
        }
        if (lifted !== id) return;
        if (e.key === 'Escape') {
            e.preventDefault();
            const back = before.current ?? (value as SortableNode[]);
            setLifted(null);
            before.current = null;
            if (back !== value) change(back);
            say(m.putBack(label, placeText(back, id)));
            return;
        }
        const arrow = readingKey(e.key, e.currentTarget);
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(arrow)) return;
        e.preventDefault();
        const p = plan(id);
        const here = p.slots.find((s) => same(s, p.place));
        if (!here) return;
        let to: TreeSlot | null | undefined;
        if (arrow === 'ArrowLeft' || arrow === 'ArrowRight') {
            const depth = here.depth + (arrow === 'ArrowRight' ? 1 : -1);
            to = p.slots.find((s) => s.gap === here.gap && s.depth === depth);
        } else {
            // The nearest gap that way with a place in it, as near this depth as it allows.
            const gaps = [...new Set(p.slots.map((s) => s.gap))];
            const gap = arrow === 'ArrowUp' ? gaps.filter((g) => g < here.gap).at(-1) : gaps.find((g) => g > here.gap);
            to = gap === undefined ? null : nearestSlot(p.slots, gap, here.depth);
        }
        if (!to) return;
        const next = insertNode(p.tree, to, p.node);
        change(next);
        say(m.movedTo(label, placeText(next, id)));
    };

    const props = { ...rest, ref: rootRef };
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

function findChildren(nodes: readonly SortableNode[], id: string): readonly SortableNode[] | undefined {
    for (const node of nodes) {
        if (node.id === id) return node.children ?? [];
        const found = node.children && findChildren(node.children, id);
        if (found) return found;
    }
    return undefined;
}

/** The part of `el` that can be seen, sideways, within whatever clips it (a table scrolled sideways). */
function visibleBox(el: HTMLElement) {
    let { left, right } = el.getBoundingClientRect();
    for (let p = el.parentElement; p; p = p.parentElement) {
        if (getComputedStyle(p).overflowX === 'visible') continue;
        const box = p.getBoundingClientRect();
        left = Math.max(left, box.left);
        right = Math.min(right, box.right);
    }
    return { left: Math.max(left, 0), right: Math.min(right, document.documentElement.clientWidth) };
}

export interface SortableTreeProps extends ComponentProps<'ul'> {
    /** The tree of ids, in order. */
    value: readonly SortableNode[];
    onValueChange: (value: SortableNode[]) => void;
    /** Whether `parentId` (null: the top level) takes item `id`; by default, everything goes anywhere. */
    accepts?: (id: string, parentId: string | null) => boolean;
    /** How far in a level is set, in px: the drop line is set in this far, and dragging this far sideways goes a level in or out. */
    indent?: number;
    /** Put its props on your own element (the single child, e.g. a Table) instead of a ul. */
    asChild?: boolean;
}
