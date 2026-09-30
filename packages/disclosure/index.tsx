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

/** The button: your label after a chevron that turns down as the section opens. Lit while open. */
export function DisclosureTrigger({ className, onClick, children, ...rest }: ComponentProps<'button'>) {
    const { open, setOpen, contentId } = useDisclosure('DisclosureTrigger');
    return (
        <button
            type="button"
            aria-expanded={open}
            aria-controls={contentId}
            onClick={(e) => {
                onClick?.(e);
                if (!e.defaultPrevented) setOpen(!open);
            }}
            className={cx(
                'zen__disclosure group text-muted-foreground -mx-2 flex w-fit items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium outline-hidden',
                'hover:bg-tint/[0.05] hover:text-foreground aria-expanded:text-foreground transition-colors duration-200',
                'focus-visible:ring-ring/50 focus-visible:ring-2',
                className,
            )}
            {...rest}
        >
            <FieldChevron
                className={cx('text-inherit duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]', !open && '-rotate-90')}
            />
            {children}
        </button>
    );
}

/**
 * What the trigger shows and hides. It grows open and folds shut (the height
 * animates, the content fades and settles); while closed it stays in the page
 * but inert, so it can't be focused and screen readers skip it. className goes
 * on the content itself.
 */
export function DisclosureContent({ className, children, ...rest }: ComponentProps<'div'>) {
    const { open, contentId } = useDisclosure('DisclosureContent');
    return (
        <div
            id={contentId}
            data-open={open || undefined}
            inert={!open}
            className="zen__disclosure-content grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] data-open:grid-rows-[1fr]"
        >
            {/* The grid row sizes this box from 0 to its content's height; overflow clips it on the way. */}
            <div className="min-h-0 overflow-hidden">
                <div
                    className={cx(
                        '-translate-y-1 pt-2 opacity-0 transition-[opacity,translate] duration-300 ease-out',
                        'in-data-open:translate-y-0 in-data-open:opacity-100',
                        className,
                    )}
                    {...rest}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}

export interface DisclosureProps {
    /** Show or hide it from your state; leave it out to let the trigger do it. */
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: ReactNode;
}
