import Disclosure, { DisclosureContent, useDisclosure } from '@zen/disclosure';
import { cx } from '@zen/utils/cx';
import { FieldChevron } from '@zen/utils/field-chevron';
import { useControllable } from '@zen/utils/useControllable';
import { ComponentProps, createContext, KeyboardEvent, ReactNode, useContext } from 'react';

interface AccordionContextValue {
    isOpen: (value: string) => boolean;
    setOpen: (value: string, open: boolean) => void;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordion(part: string) {
    const ctx = useContext(AccordionContext);
    if (!ctx) throw new Error(`<${part}> must be inside <Accordion>`);
    return ctx;
}

/**
 * Sections under headings that open one at a time (or several, with
 * `multiple`), e.g. questions and answers. Each AccordionItem is a Disclosure:
 * an AccordionTrigger and an AccordionContent that grows open and folds shut.
 * ↑↓ move between the headings, Home and End jump to the first and last.
 */
export default function Accordion(props: AccordionProps) {
    const { multiple, value, defaultValue, onValueChange, className, onKeyDown, ...rest } = props;
    const [open, setValue] = useControllable<string | null | readonly string[]>(
        value,
        defaultValue ?? (multiple ? [] : null),
        onValueChange as ((value: string | null | readonly string[]) => void) | undefined,
    );
    const shown = typeof open === 'string' ? [open] : (open ?? []);
    const context: AccordionContextValue = {
        isOpen: (v) => shown.includes(v),
        setOpen: (v, on) => {
            if (multiple) setValue(on ? [...shown, v] : shown.filter((s) => s !== v));
            else setValue(on ? v : null);
        },
    };

    const move = (e: KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(e);
        const root = e.currentTarget;
        // This accordion's headings, not those of one nested in it.
        const triggers = [...root.querySelectorAll<HTMLButtonElement>('.zen__accordion-trigger:not(:disabled)')].filter(
            (t) => t.closest('.zen__accordion') === root,
        );
        const i = triggers.indexOf(e.target as HTMLButtonElement);
        if (i === -1) return;
        const to = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: triggers.length - 1 }[e.key];
        if (to === undefined) return;
        e.preventDefault();
        triggers[(to + triggers.length) % triggers.length].focus();
    };

    return (
        <AccordionContext.Provider value={context}>
            <div
                {...rest}
                onKeyDown={move}
                className={cx('zen__accordion divide-tint/[0.07] flex flex-col divide-y', className)}
            />
        </AccordionContext.Provider>
    );
}

/** One section: an AccordionTrigger and its AccordionContent. */
export function AccordionItem({ value, className, ...rest }: AccordionItemProps) {
    const accordion = useAccordion('AccordionItem');
    const open = accordion.isOpen(value);
    return (
        <Disclosure open={open} onOpenChange={(on) => accordion.setOpen(value, on)}>
            <div data-open={open || undefined} className={cx('zen__accordion-item', className)} {...rest} />
        </Disclosure>
    );
}

/** The heading and its button: your label, and a chevron that turns over while open. */
export function AccordionTrigger({ level = 3, className, onClick, children, ...rest }: AccordionTriggerProps) {
    const { open, setOpen, contentId } = useDisclosure('AccordionTrigger');
    const Heading = `h${level}` as const;
    return (
        <Heading className="m-0! font-[inherit] text-[length:inherit]">
            <button
                type="button"
                aria-expanded={open}
                aria-controls={open ? contentId : undefined}
                onClick={(e) => {
                    onClick?.(e);
                    if (!e.defaultPrevented) setOpen(!open);
                }}
                className={cx(
                    'zen__accordion-trigger group text-muted-foreground hover:text-foreground aria-expanded:text-foreground focus-ring flex w-full cursor-pointer items-center justify-between gap-3 rounded-md py-3.5 text-start text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50',
                    className,
                )}
                {...rest}
            >
                {children}
                <FieldChevron open={open} className="ease-out-soft text-inherit" />
            </button>
        </Heading>
    );
}

/** What the trigger shows and hides; only in the page while open (or folding shut). */
export function AccordionContent({ className, ...rest }: ComponentProps<'div'>) {
    return <DisclosureContent className={cx('text-muted-foreground pt-0 pb-4 text-sm', className)} {...rest} />;
}

interface AccordionBaseProps extends Omit<ComponentProps<'div'>, 'defaultValue'> {
    children?: ReactNode;
}

export type AccordionProps = AccordionBaseProps &
    (
        | {
              /** One section open at a time (the default); opening one closes the other. */
              multiple?: false;
              /** The open section's value, or null for none, when you keep it. */
              value?: string | null;
              defaultValue?: string | null;
              onValueChange?: (value: string | null) => void;
          }
        | {
              /** Any number open at once. */
              multiple: true;
              value?: readonly string[];
              defaultValue?: readonly string[];
              onValueChange?: (value: readonly string[]) => void;
          }
    );

export interface AccordionItemProps extends ComponentProps<'div'> {
    /** Names the section in the Accordion's value. */
    value: string;
}

export interface AccordionTriggerProps extends ComponentProps<'button'> {
    /** The heading level it sits in, to fit the page's outline. Default 3. */
    level?: 2 | 3 | 4 | 5 | 6;
}
