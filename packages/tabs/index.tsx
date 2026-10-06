import Pills, { PillIndicator } from '@zen/pills';
import { cx } from '@zen/utils/cx';
import { useIndicator } from '@zen/utils/indicator';
import { reducedMotion } from '@zen/utils/motion';
import { PILL } from '@zen/utils/styles';
import {
    ComponentProps,
    createContext,
    KeyboardEvent,
    useContext,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

interface TabsContextValue {
    value: string;
    /** The tab shown before this one, so its panel can come in from that side. */
    before: string | undefined;
    /** Puts a panel on screen, returning the one it replaces, so it can send that out. */
    show: (panel: HTMLElement | null) => HTMLElement | null;
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
    const [seen, setSeen] = useState<{ value: string; before?: string }>({ value: current });
    if (seen.value !== current) setSeen({ value: current, before: seen.value });
    const shown = useRef<HTMLElement | null>(null);
    const show = (panel: HTMLElement | null) => {
        const last = shown.current;
        shown.current = panel;
        return last;
    };
    const baseId = useId();
    const select = (next: string) => {
        if (value === undefined) setUncontrolled(next);
        onValueChange?.(next);
    };
    const idFor = (part: 'tab' | 'panel', v: string) => `${baseId}-${part}-${v.replace(/\s+/g, '-')}`;

    return (
        <TabsContext.Provider value={{ value: current, before: seen.before, show, select, idFor }}>
            <div className={cx('zen__tabs relative flex flex-col gap-4', className)} {...rest} />
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
    const { value: current, before, show, idFor } = useTabs('TabPanel');
    const active = current === value;
    useIsoLayoutEffect(() => {
        if (!active) return;
        const panel = document.getElementById(idFor('panel', value));
        const last = show(panel);
        if (!panel || before === undefined || before === value) return;
        const tab = document.getElementById(idFor('tab', value));
        const lastTab = document.getElementById(idFor('tab', before));
        if (!tab || !lastTab) return;
        const toEnd = !!(tab.compareDocumentPosition(lastTab) & Node.DOCUMENT_POSITION_PRECEDING);
        panel.dataset.enter = toEnd ? 'end' : 'start';
        if (!reducedMotion()) slide(panel, last, toEnd);
    }, [active, before]);
    if (!active) return null;
    return (
        <div
            role="tabpanel"
            id={idFor('panel', value)}
            aria-labelledby={idFor('tab', value)}
            tabIndex={0}
            className={cx(
                'zen__tab-panel focus-visible:outline-ring/50 outline-hidden focus-visible:outline-2 focus-visible:outline-offset-4',
                className,
            )}
            {...rest}
        />
    );
}

const SLIDE: KeyframeAnimationOptions = { duration: 300, easing: 'cubic-bezier(0.33, 1, 0.68, 1)' };

/**
 * The picked panel slides in from its tab's side while the last one (React has
 * already taken it out) slides out the other way, both clipped to a window
 * that eases from the old panel's height to the new one's. Clipped rather than
 * resized, so the page isn't laid out again on every frame.
 */
function slide(panel: HTMLElement, last: HTMLElement | null, toEnd: boolean) {
    const root = panel.closest<HTMLElement>('.zen__tabs');
    if (!panel.animate) return;
    const ltr = getComputedStyle(panel).direction !== 'rtl';
    // In from the right when the new tab is further along (to its left in RTL).
    const sign = toEnd === ltr ? 1 : -1;
    const width = panel.offsetWidth;
    const d = Math.min(width * 0.25, 208);
    const to = panel.offsetHeight;
    let from = to;

    if (last && !last.isConnected && root) {
        const at = panel.getBoundingClientRect();
        const box = root.getBoundingClientRect();
        last.removeAttribute('id');
        last.setAttribute('aria-hidden', 'true');
        last.inert = true;
        last.getAnimations().forEach((a) => a.cancel());
        Object.assign(last.style, {
            position: 'absolute',
            top: `${at.top - box.top}px`,
            left: `${at.left - box.left}px`,
            width: `${width}px`,
            pointerEvents: 'none',
        });
        root.append(last);
        from = last.offsetHeight;
        const cut = Math.max(0, from - to);
        const out = last.animate(
            {
                translate: ['0 0', `${-sign * d}px 0`],
                opacity: [1, 0],
                clipPath: [`inset(0 0 0 0)`, sign > 0 ? `inset(0 0 ${cut}px ${d}px)` : `inset(0 ${d}px ${cut}px 0)`],
            },
            SLIDE,
        );
        out.onfinish = out.oncancel = () => last.remove();
    }

    const grow = Math.max(0, to - from);
    panel.animate(
        {
            translate: [`${sign * d}px 0`, '0 0'],
            opacity: [0, 1],
            clipPath: [sign > 0 ? `inset(0 ${d}px ${grow}px 0)` : `inset(0 0 ${grow}px ${d}px)`, 'inset(0 0 0 0)'],
        },
        SLIDE,
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
