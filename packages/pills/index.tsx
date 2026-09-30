import { cx } from '@zen/utils/cx';
import { IndicatorBox, useIndicator } from '@zen/utils/indicator';
import { Slot } from '@zen/utils/slot';
import { PILL, PILL_INDICATOR, PILL_TRACK } from '@zen/utils/styles';
import { ComponentProps, createContext, useContext, useRef } from 'react';

const PillContext = createContext<IndicatorBox | null>(null);

/** The item a PillIndicator slides to: the current link, or a selected tab. */
const ACTIVE = '[aria-current="page"], [aria-selected="true"]';

/**
 * A glass track of pills, with an optional glowing pill that slides to the
 * active one: whichever has aria-current="page" (router links such as React
 * Router's NavLink set it themselves) or aria-selected="true". It adds no role
 * of its own; what you wrap it in says what it is. Site navigation:
 *
 *   <nav aria-label="Main">
 *       <Pills>
 *           <PillIndicator />
 *           <Pill href="/month" active>Month</Pill>
 *           <Pill asChild><NavLink to="/goals">Goals</NavLink></Pill>
 *       </Pills>
 *   </nav>
 *
 * For tabs that switch panels in place, use Tabs with `<TabList variant="pills">`.
 */
export default function Pills({ className, ref, children, ...rest }: PillsProps) {
    const own = useRef<HTMLDivElement | null>(null);
    const box = useIndicator(own, ACTIVE);
    return (
        <div
            ref={(node) => {
                own.current = node;
                if (typeof ref === 'function') ref(node);
                else if (ref) ref.current = node;
            }}
            className={cx('zen__pills', PILL_TRACK, className)}
            {...rest}
        >
            <PillContext.Provider value={box}>{children}</PillContext.Provider>
        </div>
    );
}

/** The glowing pill under the active item. Place it inside Pills; hidden while none is active. */
export function PillIndicator({ className }: { className?: string }) {
    const box = useContext(PillContext);
    if (!box) return null;
    return (
        <span
            aria-hidden
            className={cx(PILL_INDICATOR, className)}
            style={{ translate: `${box.x}px 0`, width: box.w }}
        />
    );
}

/**
 * One pill: a link. `active` marks the current page. With `asChild`, the
 * styles go onto your own element instead (a router's Link or NavLink).
 */
export function Pill({ active, asChild, className, children, ...rest }: PillProps) {
    const props = { ...rest, 'aria-current': active ? ('page' as const) : undefined, className: cx(PILL, className) };
    // With asChild, a router link that sets aria-current itself keeps it unless `active` is given.
    if (asChild) {
        if (!active) delete props['aria-current'];
        return <Slot {...props}>{children}</Slot>;
    }
    return <a {...props}>{children}</a>;
}

export type PillsProps = ComponentProps<'div'>;

export interface PillProps extends ComponentProps<'a'> {
    /** This pill is the current page (aria-current="page"). */
    active?: boolean;
    /** Style the single child element (e.g. a router link) instead of rendering an <a>. */
    asChild?: boolean;
}
