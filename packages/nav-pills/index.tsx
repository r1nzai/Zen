import { cx } from '@zen/utils/cx';
import { PILL_INDICATOR, PILL_ITEM, PILL_TRACK } from '@zen/utils/styles';
import { Slot } from '@zen/utils/slot';
import { ComponentProps, createContext, useContext, useLayoutEffect, useRef, useState } from 'react';

const PillContext = createContext<{ x: number; w: number } | null>(null);

/**
 * Top navigation on a glass track. Compose what you need: links, and
 * optionally the glowing pill that slides to the current page. It follows
 * whichever link has aria-current="page", so router links that set it
 * themselves (React Router's NavLink) work as-is:
 *
 *   <NavPills aria-label="Main">
 *       <NavPillIndicator />
 *       <NavPill href="/month" active>Month</NavPill>
 *       <NavPill asChild><NavLink to="/goals">Goals</NavLink></NavPill>
 *   </NavPills>
 */
export default function NavPills({ className, children, ...rest }: NavPillsProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const [pill, setPill] = useState<{ x: number; w: number } | null>(null);

    useLayoutEffect(() => {
        const track = trackRef.current;
        if (!track) return;
        const measure = () => {
            const active = track.querySelector<HTMLElement>('[aria-current="page"]');
            setPill(active ? { x: active.offsetLeft, w: active.offsetWidth } : null);
        };
        measure();
        // Follow the current page however it changes (props, or a router flipping aria-current),
        // and link widths as fonts load or labels change.
        const mutations = new MutationObserver(measure);
        mutations.observe(track, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['aria-current'],
        });
        const resizes = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
        resizes?.observe(track);
        return () => {
            mutations.disconnect();
            resizes?.disconnect();
        };
    }, []);

    return (
        <nav className={cx('zen__nav-pills', className)} {...rest}>
            <div ref={trackRef} className={PILL_TRACK}>
                <PillContext.Provider value={pill}>{children}</PillContext.Provider>
            </div>
        </nav>
    );
}

/** The glowing pill under the current link. Place it inside NavPills; hidden while no link is current. */
export function NavPillIndicator({ className }: { className?: string }) {
    const pill = useContext(PillContext);
    if (!pill) return null;
    return (
        <span
            aria-hidden
            className={cx(PILL_INDICATOR, className)}
            style={{ translate: `${pill.x}px 0`, width: pill.w }}
        />
    );
}

const LINK = cx(
    PILL_ITEM,
    'text-muted-foreground hover:text-foreground aria-[current=page]:text-foreground aria-[current=page]:hover:text-foreground',
);

/**
 * One link in NavPills. `active` marks the current page. With `asChild`, the
 * styles go onto your own link element instead (a router's Link or NavLink).
 */
export function NavPill({ active, asChild, className, children, ...rest }: NavPillProps) {
    const props = { ...rest, 'aria-current': active ? ('page' as const) : undefined, className: cx(LINK, className) };
    // With asChild, a router link that sets aria-current itself keeps it unless `active` is given.
    if (asChild) {
        if (!active) delete props['aria-current'];
        return <Slot {...props}>{children}</Slot>;
    }
    return <a {...props}>{children}</a>;
}

export type NavPillsProps = ComponentProps<'nav'>;

export interface NavPillProps extends ComponentProps<'a'> {
    /** This link is the current page. */
    active?: boolean;
    /** Style the single child element (e.g. a router link) instead of rendering an <a>. */
    asChild?: boolean;
}
