import { cx } from '@zen/utils/cx';
import { FieldChevron } from '@zen/utils/field-chevron';
import { ComponentProps, createContext, ReactNode, useContext, useId, useState } from 'react';

interface DisclosureContextValue {
    open: boolean;
    setOpen: (open: boolean) => void;
    contentId: string;
}

const DisclosureContext = createContext<DisclosureContextValue | null>(null);

function useDisclosure(part: string) {
    const ctx = useContext(DisclosureContext);
    if (!ctx) throw new Error(`<${part}> must be inside <Disclosure>`);
    return ctx;
}

/**
 * A section that a button shows and hides, e.g. "Past (3)" under a list. Put
 * a DisclosureTrigger and a DisclosureContent inside (it adds no element of its
 * own). Opens and closes on its own, or follows `open`/`onOpenChange`.
 */
export default function Disclosure({ open, defaultOpen = false, onOpenChange, children }: DisclosureProps) {
    const [own, setOwn] = useState(defaultOpen);
    const contentId = useId();
    const shown = open ?? own;
    const setOpen = (next: boolean) => {
        if (open === undefined) setOwn(next);
        onOpenChange?.(next);
    };
    return (
        <DisclosureContext.Provider value={{ open: shown, setOpen, contentId }}>{children}</DisclosureContext.Provider>
    );
}

/** The button: a chevron (pointing down when open) and your label. */
export function DisclosureTrigger({ className, onClick, children, ...rest }: ComponentProps<'button'>) {
    const { open, setOpen, contentId } = useDisclosure('DisclosureTrigger');
    return (
        <button
            type="button"
            aria-expanded={open}
            aria-controls={open ? contentId : undefined}
            onClick={(e) => {
                onClick?.(e);
                if (!e.defaultPrevented) setOpen(!open);
            }}
            className={cx(
                'zen__disclosure text-muted-foreground hover:text-foreground focus-visible:ring-ring/40 flex w-fit items-center gap-1.5 rounded text-sm outline-hidden focus-visible:ring-2',
                className,
            )}
            {...rest}
        >
            <FieldChevron className={cx('text-inherit duration-150', !open && '-rotate-90')} />
            {children}
        </button>
    );
}

/** What the trigger shows and hides; not rendered while closed. */
export function DisclosureContent(props: ComponentProps<'div'>) {
    const { open, contentId } = useDisclosure('DisclosureContent');
    if (!open) return null;
    return <div id={contentId} {...props} />;
}

export interface DisclosureProps {
    /** Show or hide it from your state; leave it out to let the trigger do it. */
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: ReactNode;
}
