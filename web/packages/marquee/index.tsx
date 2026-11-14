import { cx } from '@zen/utils/cx';
import { reducedMotion } from '@zen/utils/motion';
import { useMergedRefs } from '@zen/utils/refs';
import { ComponentProps, useEffect, useLayoutEffect, useRef, useState } from 'react';

const SPEED = 40; // px per second, whatever the length
const PAUSE = 1200; // ms at each end
const FADE = 16; // px, the edges' fade; the end scrolls clear of it

/**
 * One line of text that's cut off with an ellipsis, and scrolls to show the
 * rest: to the end, a pause, and back. Only text that doesn't fit moves.
 * With `trigger="hover"` (the default) it moves while it, or the closest
 * element marked `data-zen-marquee-host` (a row, a tile, a link), is hovered
 * or holds focus; `"always"` keeps it moving, e.g. for what's playing. Stays
 * an ellipsis for reduced motion. Set the type and colour with className.
 */
export default function Marquee({ trigger = 'hover', className, children, ref, ...rest }: MarqueeProps) {
    const own = useRef<HTMLSpanElement>(null);
    const content = useRef<HTMLSpanElement>(null);
    // How far the text runs past the box (0 when it fits).
    const [hidden, setHidden] = useState(0);
    const [active, setActive] = useState(false);

    useLayoutEffect(() => {
        const box = own.current;
        const text = content.current;
        if (!box || !text) return;
        // offsetWidth isn't moved by the scroll's translate, so this holds while moving.
        const measure = () => setHidden(Math.max(0, text.offsetWidth - box.clientWidth));
        measure();
        const resizes = new ResizeObserver(measure);
        resizes.observe(box);
        const edits = new MutationObserver(measure);
        edits.observe(text, { childList: true, subtree: true, characterData: true });
        return () => {
            resizes.disconnect();
            edits.disconnect();
        };
    }, []);

    useEffect(() => {
        const box = own.current;
        if (trigger !== 'hover' || !box) return;
        const host = box.closest<HTMLElement>('[data-zen-marquee-host]') ?? box;
        // Keyboard focus counts, not the focus a click leaves on a button.
        const focused = () => host.matches(':focus-visible, :has(:focus-visible)');
        const enter = () => setActive(true);
        const leave = () => setActive(focused());
        const focus = () => setActive(focused() || host.matches(':hover'));
        const blur = (e: FocusEvent) =>
            !host.contains(e.relatedTarget as Node | null) && setActive(host.matches(':hover'));
        host.addEventListener('pointerenter', enter);
        host.addEventListener('pointerleave', leave);
        host.addEventListener('focusin', focus);
        host.addEventListener('focusout', blur);
        return () => {
            host.removeEventListener('pointerenter', enter);
            host.removeEventListener('pointerleave', leave);
            host.removeEventListener('focusin', focus);
            host.removeEventListener('focusout', blur);
        };
    }, [trigger]);

    const moving = hidden > 1 && (trigger === 'always' || active);

    useEffect(() => {
        const box = own.current;
        const text = content.current;
        if (!moving || !box || !text || reducedMotion()) return;
        const distance = hidden + FADE;
        const move = (distance / SPEED) * 1000;
        const total = 2 * (PAUSE + move);
        const to = getComputedStyle(box).direction === 'rtl' ? distance : -distance;
        const at = (ms: number) => ms / total;
        const timing = { duration: total, iterations: Infinity };
        const scroll = text.animate(
            [
                { translate: '0' },
                { translate: '0', offset: at(PAUSE) },
                { translate: `${to}px`, offset: at(PAUSE + move) },
                { translate: `${to}px`, offset: at(2 * PAUSE + move) },
                { translate: '0' },
            ],
            { ...timing, easing: 'ease-in-out' },
        );
        // The start's fade only shows once the text has moved off it.
        const fade = box.animate(
            [
                { '--zen-marquee-fade-start': '0px' },
                { '--zen-marquee-fade-start': '0px', offset: at(PAUSE) },
                { '--zen-marquee-fade-start': `${FADE}px`, offset: at(PAUSE + Math.min(move, 400)) },
                { '--zen-marquee-fade-start': `${FADE}px`, offset: at(2 * PAUSE + 2 * move - Math.min(move, 400)) },
                { '--zen-marquee-fade-start': '0px' },
            ],
            timing,
        );
        box.dataset.moving = '';
        return () => {
            scroll.cancel();
            fade.cancel();
            delete box.dataset.moving;
        };
    }, [moving, hidden]);

    return (
        <span ref={useMergedRefs(own, ref)} className={cx('zen__marquee', className)} {...rest}>
            <span ref={content} className="zen__marquee-content">
                {children}
            </span>
        </span>
    );
}

export interface MarqueeProps extends ComponentProps<'span'> {
    /** `'hover'` (default): moves while it or its `data-zen-marquee-host` is hovered or focused. `'always'`: keeps moving. */
    trigger?: 'hover' | 'always';
}
