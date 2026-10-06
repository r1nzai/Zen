import { cx } from '@zen/utils/cx';
import { reducedMotion } from '@zen/utils/motion';
import {
    ComponentProps,
    createContext,
    KeyboardEvent,
    PointerEvent,
    useContext,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const SETTLE: KeyframeAnimationOptions = { duration: 220, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' };
/** Within this far of the scroller's edge, a drag scrolls it, faster nearer the edge. */
const EDGE = 48;

interface SortableContextValue {
    grab: (e: PointerEvent<HTMLElement>, id: string) => void;
    key: (e: KeyboardEvent<HTMLElement>, id: string, label: string) => void;
    lifted: string | null;
}

const SortableContext = createContext<SortableContextValue | null>(null);

function useSortable(part: string) {
    const ctx = useContext(SortableContext);
    if (!ctx) throw new Error(`<${part}> must be inside <SortableList>`);
    return ctx;
}

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
 */
export function SortableList({ value, onChange, className, children, ...rest }: SortableListProps) {
    const list = useRef<HTMLUListElement>(null);
    const [lifted, setLifted] = useState<string | null>(null);
    const [said, say] = useState('');
    // Where each item was on screen before a change we made, to move them from there.
    const flip = useRef<Map<string, number> | null>(null);
    const before = useRef<readonly string[] | null>(null);

    const items = () => [...(list.current?.querySelectorAll<HTMLElement>(':scope > [data-sortable-id]') ?? [])];
    const tops = () => new Map(items().map((el) => [el.dataset.sortableId!, el.getBoundingClientRect().top]));
    const reorder = (next: string[]) => {
        flip.current = tops();
        onChange(next);
    };

    useIsoLayoutEffect(() => {
        const was = flip.current;
        flip.current = null;
        if (!was) return;
        for (const el of items()) {
            el.style.removeProperty('translate');
            const from = was.get(el.dataset.sortableId!);
            const by = from === undefined ? 0 : from - el.getBoundingClientRect().top;
            if (by && !reducedMotion()) el.animate?.({ translate: [`0 ${by}px`, '0 0'] }, SETTLE);
        }
    }, [value]);

    const grab = (e: PointerEvent<HTMLElement>, id: string) => {
        if (e.button !== 0 || lifted) return;
        const els = items();
        const from = els.findIndex((el) => el.dataset.sortableId === id);
        const dragged = els[from];
        if (!dragged) return;
        e.preventDefault();
        const handle = e.currentTarget;
        handle.setPointerCapture?.(e.pointerId);
        const scroller = scrollerOf(list.current!);
        const startScroll = scroller.scrollTop;
        const startY = e.clientY;
        const rects = els.map((el) => el.getBoundingClientRect());
        // The room the dragged item takes: its height and the gap after it.
        const gap = rects.length > 1 ? rects[1].top - rects[0].bottom : 0;
        const room = rects[from].height + gap;
        const centres = rects.map((r) => r.top + r.height / 2);
        let target = from;
        let y = e.clientY;
        let frame = 0;

        dragged.dataset.dragging = '';
        list.current!.dataset.sorting = '';
        const place = () => {
            const dy = y - startY + scroller.scrollTop - startScroll;
            dragged.style.translate = `0 ${dy}px`;
            const centre = centres[from] + dy;
            const was = target;
            target = from;
            while (target < els.length - 1 && centre > centres[target + 1]) target++;
            while (target > 0 && centre < centres[target - 1]) target--;
            // A light tap as it takes a new place, where phones can vibrate.
            if (target !== was) navigator.vibrate?.(5);
            els.forEach((el, i) => {
                if (i === from) return;
                const shift = from < i && i <= target ? -room : target <= i && i < from ? room : 0;
                el.style.translate = shift ? `0 ${shift}px` : '';
            });
        };
        // Near the scroller's edge, scroll it, and keep placing as the content moves under the pointer.
        const scroll = () => {
            frame = 0;
            const box =
                scroller === document.scrollingElement
                    ? { top: 0, bottom: innerHeight }
                    : scroller.getBoundingClientRect();
            const speed =
                y < box.top + EDGE ? -(box.top + EDGE - y) : y > box.bottom - EDGE ? y - (box.bottom - EDGE) : 0;
            if (!speed) return;
            scroller.scrollTop += speed / 3;
            place();
            frame = requestAnimationFrame(scroll);
        };
        const onMove = (m: globalThis.PointerEvent) => {
            if (m.pointerId !== e.pointerId) return;
            y = m.clientY;
            place();
            frame ||= requestAnimationFrame(scroll);
        };
        const onEnd = (u: globalThis.PointerEvent) => {
            if (u.pointerId !== e.pointerId) return;
            handle.removeEventListener('pointermove', onMove);
            handle.removeEventListener('pointerup', onEnd);
            handle.removeEventListener('pointercancel', onEnd);
            cancelAnimationFrame(frame);
            delete dragged.dataset.dragging;
            delete list.current?.dataset.sorting;
            if (u.type === 'pointerup' && target !== from) reorder(move(value, from, target));
            else {
                flip.current = tops();
                for (const el of els) el.style.removeProperty('translate');
                // Nothing changes, so the layout effect won't run: settle back here.
                for (const el of els) {
                    const by = flip.current.get(el.dataset.sortableId!)! - el.getBoundingClientRect().top;
                    if (by && !reducedMotion()) el.animate?.({ translate: [`0 ${by}px`, '0 0'] }, SETTLE);
                }
                flip.current = null;
            }
        };
        handle.addEventListener('pointermove', onMove);
        handle.addEventListener('pointerup', onEnd);
        handle.addEventListener('pointercancel', onEnd);
    };

    const key = (e: KeyboardEvent<HTMLElement>, id: string, label: string) => {
        const at = value.indexOf(id);
        const of = `${at + 1} of ${value.length}`;
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (lifted === id) {
                setLifted(null);
                before.current = null;
                say(`${label} dropped, ${of}.`);
            } else if (!lifted) {
                setLifted(id);
                before.current = value;
                say(`${label} picked up, ${of}. Arrow keys move it, Space drops it, Escape puts it back.`);
            }
        } else if (lifted === id && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
            e.preventDefault();
            const to = at + (e.key === 'ArrowUp' ? -1 : 1);
            if (to < 0 || to >= value.length) return;
            reorder(move(value, at, to));
            say(`${label}, ${to + 1} of ${value.length}.`);
        } else if (lifted === id && e.key === 'Escape') {
            e.preventDefault();
            const back = before.current ?? value;
            setLifted(null);
            before.current = null;
            if (back !== value) reorder([...back]);
            say(`${label} put back, ${back.indexOf(id) + 1} of ${back.length}.`);
        }
    };

    return (
        <SortableContext.Provider value={{ grab, key, lifted }}>
            <ul ref={list} className={cx('zen__sortable relative flex flex-col', className)} {...rest}>
                {children}
            </ul>
            <span aria-live="assertive" className="sr-only">
                {said}
            </span>
        </SortableContext.Provider>
    );
}

/** One item in a SortableList; give it the `id` it has in the list's value. */
export function SortableItem({ id, className, ...rest }: SortableItemProps) {
    const { lifted } = useSortable('SortableItem');
    return (
        <li
            data-sortable-id={id}
            data-lifted={lifted === id || undefined}
            className={cx(
                // Lifted, it's a card of its own, covering the items it passes over.
                'zen__sortable-item relative transition-[box-shadow,scale,background-color] duration-200 data-dragging:bg-card data-lifted:bg-card data-dragging:z-10 data-dragging:rounded-xl data-dragging:scale-[1.02] data-dragging:shadow-[0_0_0_1px_oklch(var(--tint)/0.08),0_12px_32px_-12px_oklch(0_0_0/0.6)] data-lifted:z-10 data-lifted:rounded-xl data-lifted:shadow-[0_0_0_2px_oklch(var(--primary)/0.6)]',
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
    return (
        <button
            type="button"
            aria-label={`Reorder ${label}`}
            aria-pressed={lifted === id}
            onPointerDown={(e) => grab(e, id)}
            onKeyDown={(e) => key(e, id, label)}
            className={cx(
                'text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-md outline-hidden select-none focus-visible:ring-2 active:cursor-grabbing',
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
function scrollerOf(el: HTMLElement): HTMLElement {
    for (let p = el.parentElement; p; p = p.parentElement) {
        if (/auto|scroll/.test(getComputedStyle(p).overflowY) && p.scrollHeight > p.clientHeight) return p;
    }
    return (document.scrollingElement as HTMLElement) ?? document.documentElement;
}

export interface SortableListProps extends Omit<ComponentProps<'ul'>, 'onChange'> {
    /** The items' ids, in order. */
    value: readonly string[];
    onChange: (value: string[]) => void;
}

export interface SortableItemProps extends ComponentProps<'li'> {
    id: string;
}

export interface SortableHandleProps extends Omit<ComponentProps<'button'>, 'id'> {
    /** The item's id, as in the list's value. */
    id: string;
    /** The item's name, e.g. "Rent". */
    label: string;
}
