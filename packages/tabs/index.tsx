import { cx } from '@zen/utils/cx';
import { PILL_INDICATOR, PILL_ITEM, PILL_TRACK } from '@zen/utils/styles';
import {
    ComponentProps,
    createContext,
    KeyboardEvent,
    useContext,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

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
 * `underline` (default): Sora's in-page tabs, a bar under the active tab.
 * `pills`: Sora's top-nav look, a glowing pill sliding along a glass track.
 */
export function TabList({ variant = 'underline', className, children, ...rest }: TabListProps) {
    const { value } = useTabs('TabList');
    const pills = variant === 'pills';
    const listRef = useRef<HTMLDivElement>(null);
    const [indicator, setIndicator] = useState({ left: 0, width: 0 });

    // Follow the active tab: on change, and when tab widths change (fonts loading, resizes).
    useLayoutEffect(() => {
        const list = listRef.current;
        if (!list) return;
        const measure = () => {
            const active = list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
            setIndicator(active ? { left: active.offsetLeft, width: active.offsetWidth } : { left: 0, width: 0 });
        };
        measure();
        if (typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(measure);
        observer.observe(list);
        return () => observer.disconnect();
    }, [value]);

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

    return (
        <div
            ref={listRef}
            role="tablist"
            onKeyDown={onKeyDown}
            className={cx(pills ? PILL_TRACK : 'border-border relative flex gap-1 border-b', className)}
            {...rest}
        >
            <VariantContext.Provider value={variant}>{children}</VariantContext.Provider>
            {pills ? (
                indicator.width > 0 && (
                    <span
                        aria-hidden
                        className={PILL_INDICATOR}
                        style={{ width: indicator.width, translate: `${indicator.left}px 0` }}
                    />
                )
            ) : (
                <span
                    aria-hidden
                    className="bg-primary absolute bottom-[-1px] left-0 h-0.5 transition-[translate,width] duration-150 ease-in-out"
                    style={{ width: indicator.width, translate: `${indicator.left}px 0` }}
                />
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
                    ? PILL_ITEM
                    : 'focus-visible:ring-ring px-3 py-2 text-sm whitespace-nowrap outline-hidden select-none focus-visible:ring-1',
                'text-muted-foreground hover:text-foreground data-active:text-foreground',
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
            className={cx('outline-hidden', className)}
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
