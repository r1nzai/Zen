import { cx } from '@zen/utils/cx';
import { FieldChevron } from '@zen/utils/field-chevron';
import { ComponentProps, createContext, ReactNode, useContext, useEffect, useId, useRef, useState } from 'react';

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

/** The button: your label after a chevron that turns down as the section opens. Brightens on hover and while open. */
export function DisclosureTrigger({ className, onClick, children, ...rest }: ComponentProps<'button'>) {
    const { open, setOpen, contentId } = useDisclosure('DisclosureTrigger');
    return (
        <button
            type="button"
            aria-expanded={open}
            // The content is only in the page while open (or folding shut).
            aria-controls={open ? contentId : undefined}
            onClick={(e) => {
                onClick?.(e);
                if (!e.defaultPrevented) setOpen(!open);
            }}
            className={cx(
                'zen__disclosure group text-muted-foreground flex w-fit cursor-pointer items-center gap-1.5 rounded-md text-sm font-medium outline-hidden',
                'hover:text-foreground aria-expanded:text-foreground transition-colors duration-200',
                'focus-visible:outline-ring/50 focus-visible:outline-2 focus-visible:outline-offset-4',
                className,
            )}
            {...rest}
        >
            <FieldChevron className={cx('ease-out-soft text-inherit duration-300', !open && '-rotate-90')} />
            {children}
        </button>
    );
}

/**
 * What the trigger shows and hides. It grows open and folds shut (the height
 * animates, the content fades and settles). While closed it isn't rendered at
 * all, so what's inside costs nothing and can't be found, focused or read; it
 * mounts as it opens and unmounts once it has folded shut. className goes on
 * the content itself.
 */
export function DisclosureContent({ className, children, ...rest }: ComponentProps<'div'>) {
    const { open, contentId } = useDisclosure('DisclosureContent');
    const ref = useRef<HTMLDivElement>(null);
    // In the page while open, and while folding shut after.
    const [present, setPresent] = useState(open);
    // Mounted by opening (not open from the start), so it grows in rather than appearing.
    const [grows, setGrows] = useState(false);
    if (open && !present) {
        setPresent(true);
        setGrows(true);
    }

    // Once closed, leave when its own transitions end (at once without any, e.g. reduced
    // motion off in a browser without them). Reopening meanwhile cancels them and keeps it.
    useEffect(() => {
        const el = ref.current;
        if (open || !present || !el) return;
        let live = true;
        Promise.all((el.getAnimations?.() ?? []).map((a) => a.finished)).then(
            () => live && setPresent(false),
            () => {},
        );
        return () => {
            live = false;
        };
    }, [open, present]);

    if (!present) return null;
    return (
        <div
            ref={ref}
            id={contentId}
            data-open={open || undefined}
            inert={!open}
            className={cx(
                'zen__disclosure-content ease-out-soft grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 data-open:grid-rows-[1fr]',
                grows && 'data-open:starting:grid-rows-[0fr]',
            )}
        >
            {/* The grid row sizes this box from 0 to its content's height; overflow clips it on the way. */}
            <div className="min-h-0 overflow-hidden">
                <div
                    className={cx(
                        'zen__disclosure-body -translate-y-1 pt-2 opacity-0 transition-[opacity,translate] duration-300 ease-out',
                        'in-data-open:translate-y-0 in-data-open:opacity-100',
                        grows && 'in-data-open:starting:-translate-y-1 in-data-open:starting:opacity-0',
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
