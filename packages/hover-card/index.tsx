import { cx } from '@zen/utils/cx';
import { useGraphicsMode } from '@zen/utils/graphics';
import { Slot } from '@zen/utils/slot';
import { POPUP } from '@zen/utils/styles';
import { anchoredStyle, anchorFor, useAnchorFallback } from '@zen/utils/useAnchoredPopup';
import { type HoverPopup, useHoverPopup } from '@zen/utils/useHoverPopup';
import { useHydrated } from '@zen/utils/useHydrated';
import { ComponentProps, createContext, ReactNode, useContext, useRef } from 'react';
import { createPortal } from 'react-dom';

const HoverCardContext = createContext<HoverPopup | null>(null);

function useHoverCard(part: string) {
    const ctx = useContext(HoverCardContext);
    if (!ctx) throw new Error(`<${part}> must be inside <HoverCard>`);
    return ctx;
}

/**
 * A preview of what a link points to, e.g. a person or an account: a glass
 * card shown after the pointer rests on the link (`openDelay`), or while it
 * has keyboard focus, and kept while the pointer or focus is on the card.
 * Escape hides it. What it shows is extra, out of the tab order: everything in
 * it should be reachable by following the link too. Put a HoverCardTrigger and
 * a HoverCardContent inside (it can go in a paragraph).
 */
export default function HoverCard({ openDelay = 500, closeDelay = 200, children }: HoverCardProps) {
    useGraphicsMode();
    const card = useHoverPopup('zen__hover-card', { openDelay, closeDelay });
    return <HoverCardContext.Provider value={card}>{children}</HoverCardContext.Provider>;
}

/** What the card previews: a link by default (give it `href`). With `asChild`, your own element (e.g. your router's link). */
export function HoverCardTrigger({
    asChild,
    style,
    className,
    onPointerEnter,
    onPointerLeave,
    onFocus,
    onBlur,
    onKeyDown,
    children,
    ...rest
}: HoverCardTriggerProps) {
    const card = useHoverCard('HoverCardTrigger');
    const props = {
        ...rest,
        ...anchorFor(card.id),
        style: { ...anchorFor(card.id).style, ...style },
        ...card.triggerProps<HTMLAnchorElement>({ onPointerEnter, onPointerLeave, onFocus, onBlur, onKeyDown }),
    };
    if (asChild)
        return (
            <Slot {...props} className={className}>
                {children}
            </Slot>
        );
    return (
        <a
            {...props}
            className={cx('text-primary focus-ring rounded-sm underline-offset-4 hover:underline', className)}
        >
            {children}
        </a>
    );
}

/** The card: glass, below the trigger (above it if there's no room), lined up with its start by default. */
export function HoverCardContent(props: HoverCardContentProps) {
    // In <body>: a card is a block, and its trigger is often in running text, where a block can't go.
    // Only once hydrated, as there's no <body> to portal into on the server (and it starts hidden).
    if (!useHydrated()) return null;
    return createPortal(<Card {...props} />, document.body);
}

function Card({
    align = 'start',
    offset = 8,
    className,
    style,
    onPointerEnter,
    onPointerLeave,
    onBlur,
    onKeyDown,
    children,
    ...rest
}: HoverCardContentProps) {
    const card = useHoverCard('HoverCardContent');
    const ref = useRef<HTMLDivElement>(null);
    useAnchorFallback(ref);
    return (
        <div
            {...rest}
            ref={ref}
            id={card.id}
            // Manual: it doesn't close other popovers, and the trigger decides when it shows.
            popover="manual"
            {...card.contentProps({ onPointerEnter, onPointerLeave, onBlur, onKeyDown })}
            style={{ ...anchoredStyle(card.id, { align, offset }), ...style }}
            className={cx('zen__popover fixed z-50 w-72 overflow-visible p-4', POPUP, className)}
        >
            {children}
        </div>
    );
}

export interface HoverCardProps {
    /** How long the pointer rests on the trigger before the card shows, in ms. Default 500. */
    openDelay?: number;
    /** How long it stays after the pointer leaves, in ms, so the pointer can reach it. Default 200. */
    closeDelay?: number;
    children?: ReactNode;
}

export interface HoverCardTriggerProps extends ComponentProps<'a'> {
    /** Put the trigger's props on your own element instead of rendering a link. */
    asChild?: boolean;
}

export interface HoverCardContentProps extends ComponentProps<'div'> {
    /** Lined up with the trigger's start (default) or end edge, or centred on it. */
    align?: 'start' | 'end' | 'center';
    /** Gap from the trigger, in px. */
    offset?: number;
}
