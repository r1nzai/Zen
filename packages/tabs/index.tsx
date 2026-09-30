import Pills, { PillIndicator } from '@zen/pills';
import { cx } from '@zen/utils/cx';
import { useIndicator } from '@zen/utils/indicator';
import { PILL } from '@zen/utils/styles';
import { ComponentProps, createContext, KeyboardEvent, useContext, useId, useRef, useState } from 'react';

interface TabsContextValue {
    value: string;
    select: (value: string) => void;
    idFor: (part: 'tab' | 'panel', value: string) => string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs(component: string) {
    const ctx = useContext(TabsContext);
    if (!ctx) throw new Error(`<${component}> must be inside <Tabs>`);
    return ctx;
}

/** Tab set with an underline that slides to the active tab. Controlled (`value`) or not (`defaultValue`). */
export default function Tabs({ value, defaultValue = '', onValueChange, className, ...rest }: TabsProps) {
    const [uncontrolled, setUncontrolled] = useState(defaultValue);
    const current = value ?? uncontrolled;
    const baseId = useId();
    const select = (next: string) => {
        if (value === undefined) setUncontrolled(next);
        onValueChange?.(next);
    };
    const idFor = (part: 'tab' | 'panel', v: string) => `${baseId}-${part}-${v.replace(/\s+/g, '-')}`;

    return (
        <TabsContext.Provider value={{ value: current, select, idFor }}>
            <div className={cx('zen__tabs flex flex-col gap-4', className)} {...rest} />
        </TabsContext.Provider>
    );
}

const VariantContext = createContext<TabListVariant>('underline');

/**
 * The row of tabs. `underline` (default): in-page tabs, a bar sliding under
 * the active tab. `pills`: the Pills look, a glowing pill sliding along a
 * glass track (for navigation between pages, use Pills itself).
 */
export function TabList({ variant = 'underline', className, children, ...rest }: TabListProps) {
    useTabs('TabList');
    const listRef = useRef<HTMLDivElement>(null);

    // Arrow keys move between tabs (and select them), Home/End jump to the ends.
    const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        const tabs = Array.from(
            listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)') ?? [],
        );
        const i = tabs.indexOf(document.activeElement as HTMLButtonElement);
        if (i === -1) return;
        const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (next === undefined) return;
        e.preventDefault();
        const tab = tabs[(next + tabs.length) % tabs.length];
        tab.focus();
        tab.click();
    };

    const tabs = <VariantContext.Provider value={variant}>{children}</VariantContext.Provider>;
    if (variant === 'pills') {
        return (
            <Pills ref={listRef} role="tablist" onKeyDown={onKeyDown} className={className} {...rest}>
                {tabs}
                <PillIndicator />
            </Pills>
        );
    }
    return (
        <UnderlineTrack ref={listRef} role="tablist" onKeyDown={onKeyDown} className={className} {...rest}>
            {tabs}
        </UnderlineTrack>
    );
}

/** A row with a bar that slides under the active tab. */
function UnderlineTrack({ ref, className, children, ...rest }: ComponentProps<'div'>) {
    const own = useRef<HTMLDivElement | null>(null);
    const box = useIndicator(own, '[role="tab"][aria-selected="true"]');
    return (
        <div
            ref={(node) => {
                own.current = node;
                if (typeof ref === 'function') ref(node);
                else if (ref) ref.current = node;
            }}
            className={cx('border-border relative flex gap-1 border-b', className)}
            {...rest}
        >
            {children}
            {box ? (
                // Its own key, like PillIndicator's: it starts in place instead of sliding in.
                <span
                    key="measured"
                    aria-hidden
                    className="zen__tab-bar bg-primary absolute bottom-[-1px] left-0 h-0.5 transition-[translate,width] duration-150 ease-in-out"
                    style={{ width: box.w, translate: `${box.x}px 0` }}
                />
            ) : (
                // Not measured yet: the active tab draws the bar itself (see theme.css).
                <span key="pending" aria-hidden data-pending className="zen__tab-bar hidden" />
            )}
        </div>
    );
}

export function Tab({ value, className, onClick, ...rest }: TabProps) {
    const { value: current, select, idFor } = useTabs('Tab');
    const variant = useContext(VariantContext);
    const active = current === value;
    return (
        <button
            type="button"
            role="tab"
            id={idFor('tab', value)}
            aria-selected={active}
            aria-controls={idFor('panel', value)}
            tabIndex={active ? 0 : -1}
            data-active={active || undefined}
            onClick={(e) => {
                select(value);
                onClick?.(e);
            }}
            className={cx(
                variant === 'pills'
                    ? PILL
                    : 'focus-visible:ring-ring text-muted-foreground hover:text-foreground data-active:text-foreground cursor-pointer px-3 py-2 text-sm whitespace-nowrap outline-hidden select-none focus-visible:ring-1 disabled:cursor-not-allowed',
                className,
            )}
            {...rest}
        />
    );
}

export function TabPanel({ value, className, ...rest }: TabPanelProps) {
    const { value: current, idFor } = useTabs('TabPanel');
    if (current !== value) return null;
    return (
        <div
            role="tabpanel"
            id={idFor('panel', value)}
            aria-labelledby={idFor('tab', value)}
            tabIndex={0}
            className={cx(
                'focus-visible:outline-ring/50 outline-hidden focus-visible:outline-2 focus-visible:outline-offset-4',
                className,
            )}
            {...rest}
        />
    );
}

export interface TabsProps extends Omit<ComponentProps<'div'>, 'defaultValue'> {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
}

export type TabListVariant = 'underline' | 'pills';

export interface TabListProps extends ComponentProps<'div'> {
    variant?: TabListVariant;
}

export interface TabProps extends Omit<ComponentProps<'button'>, 'value'> {
    value: string;
}

export interface TabPanelProps extends ComponentProps<'div'> {
    value: string;
}
