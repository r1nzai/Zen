import XMark from '@zen/icons/micro/x-mark';
import { cx } from '@zen/utils/cx';
import { reducedMotion } from '@zen/utils/motion';
import { Children, ComponentProps, ReactNode, RefObject, useEffect, useLayoutEffect, useRef } from 'react';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const MOVE = { duration: 260, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' } satisfies KeyframeAnimationOptions;
const LEAVE = { duration: 120, easing: 'ease-in' } satisfies KeyframeAnimationOptions;

/**
 * The filters in effect, as chips each removed with its ×, and "Clear all"
 * once there are two or more. Renders nothing when no filter is set.
 */
export default function FilterBar({
    onClear,
    clearLabel = 'Clear all',
    'aria-label': label = 'Active filters',
    className,
    children,
    ref,
    ...rest
}: FilterBarProps) {
    const count = Children.toArray(children).length;
    const bar = useRef<HTMLDivElement>(null);
    useSlide(bar);
    if (count === 0) return null;
    return (
        <div
            ref={(node) => {
                bar.current = node;
                if (typeof ref === 'function') return ref(node);
                if (ref) ref.current = node;
            }}
            role="group"
            aria-label={label}
            className={cx('zen__filter-bar relative flex flex-wrap items-center gap-1.5', className)}
            {...rest}
        >
            {children}
            {count > 1 && onClear && (
                <button
                    type="button"
                    onClick={onClear}
                    className="zen__filter-clear text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 touch-target ml-1 cursor-pointer rounded-md px-1.5 py-1 text-xs outline-hidden focus-visible:ring-2"
                >
                    {clearLabel}
                </button>
            )}
        </div>
    );
}

/** A removed chip fades out where it was (React has already taken it out), then the others slide over. */
function useSlide(ref: RefObject<HTMLDivElement | null>) {
    const last = useRef(new Map<Element, { left: number; top: number }>());
    useIsoLayoutEffect(() => {
        const el = ref.current;
        const before = last.current;
        const at = new Map<Element, { left: number; top: number }>();
        for (const child of el ? [...el.children] : []) {
            if (child instanceof HTMLElement && !child.dataset.zenLeaving)
                at.set(child, { left: child.offsetLeft, top: child.offsetTop });
        }
        last.current = at;
        if (!el || reducedMotion()) return;
        let left = false;
        for (const [child, was] of before) {
            if (child.isConnected || !(child instanceof HTMLElement)) continue;
            left = true;
            child.dataset.zenLeaving = '';
            child.setAttribute('aria-hidden', 'true');
            child.inert = true;
            Object.assign(child.style, {
                position: 'absolute',
                left: `${was.left}px`,
                top: `${was.top}px`,
                margin: '0',
                animation: 'none',
            });
            el.append(child);
            const fade = child.animate?.({ opacity: [1, 0], scale: [1, 0.9] }, LEAVE);
            if (fade) fade.onfinish = fade.oncancel = () => child.remove();
            else child.remove();
        }
        const timing = { ...MOVE, delay: left ? LEAVE.duration : 0, fill: 'backwards' as const };
        for (const [child, to] of at) {
            const was = before.get(child);
            if (!was || (was.left === to.left && was.top === to.top)) continue;
            // Sliding to another line would pass through the chips on the way.
            if (was.top !== to.top)
                child.animate?.(
                    { opacity: [0, 1], translate: ['0 3px', '0 0'] },
                    { ...timing, duration: 200, delay: timing.delay + MOVE.duration * 0.6 },
                );
            else child.animate?.({ translate: [`${was.left - to.left}px 0`, '0 0'] }, timing);
        }
    });
}

/** One filter in a FilterBar: what it is (e.g. "Amount: $50–$500"), and its × to remove it. */
export function FilterChip({ onRemove, removeLabel = 'Remove filter', className, children }: FilterChipProps) {
    return (
        <span
            className={cx(
                'zen__filter-chip bg-primary/12 text-foreground inline-flex items-center gap-1 rounded-full py-1 pr-1 pl-3 text-xs shadow-[inset_0_0_0_1px_oklch(var(--primary)/0.25)]',
                className,
            )}
        >
            {children}
            <button
                type="button"
                aria-label={removeLabel}
                onClick={onRemove}
                className="text-muted-foreground hover:text-foreground hover:bg-tint/10 focus-visible:ring-ring/50 touch-target grid size-5 cursor-pointer place-items-center rounded-full outline-hidden focus-visible:ring-2"
            >
                <XMark className="size-3" />
            </button>
        </span>
    );
}

export interface FilterBarProps extends ComponentProps<'div'> {
    /** Removes every filter; shown as "Clear all" once there are two or more. */
    onClear?: () => void;
    clearLabel?: ReactNode;
}

export interface FilterChipProps {
    onRemove: () => void;
    /** The × button's name for screen readers, e.g. "Remove amount filter". */
    removeLabel?: string;
    className?: string;
    children: ReactNode;
}
