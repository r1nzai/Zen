import MoonMicro from '@zen/icons/micro/moon';
import SunMicro from '@zen/icons/micro/sun';
import { cx } from '@zen/utils/cx';
import type { Appearance } from '@zen/utils/theme';
import { prepareThemeWave, themeWave } from '@zen/utils/theme-wave';
import { type RefObject, useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

/** The inline script ThemeScript renders (for frameworks that take a raw string). */
export const themeScript = (storageKey = 'theme') =>
    `try{var t=localStorage.getItem(${JSON.stringify(storageKey)}),r=document.documentElement;if(t==='light'||t==='dark'){r.classList.remove('light','dark');r.classList.add(t)}}catch(e){}`;

/**
 * Put in <head>: applies the remembered theme before the first paint, so a
 * light-theme visitor never sees a dark flash on page load.
 */
export function ThemeScript({ storageKey = 'theme' }: { storageKey?: string }) {
    return <script dangerouslySetInnerHTML={{ __html: themeScript(storageKey) }} />;
}

// Every ThemeToggle on the page shows the theme <html> has: told at once when one
// of them switches it (inside the view transition, so the new page shows the new
// icons), and by a MutationObserver when anything else does.
const listeners = new Set<() => void>();
function subscribe(onChange: () => void) {
    listeners.add(onChange);
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
        listeners.delete(onChange);
        observer.disconnect();
    };
}
const current = (): Appearance => (document.documentElement.classList.contains('light') ? 'light' : 'dark');

/**
 * Switches between the dark and light themes; the new theme spreads from the
 * button like a drop of water (themeWave).
 *
 * On its own, it switches <html>'s class and remembers the choice (localStorage):
 * add ThemeScript to <head> to apply it on the next visit. Give it `value` and
 * `onChange` and the theme is yours: it shows `value` and leaves applying and
 * storing the choice to `onChange` (in your state, a database, a cookie…).
 * With `target` too, it switches the theme of one element (a panel, a preview),
 * and the water stays inside it.
 */
export default function ThemeToggle({ value, onChange, target, storageKey = 'theme', className }: ThemeToggleProps) {
    // Dark on the server; the real theme once hydrated.
    const shown = useSyncExternalStore(subscribe, current, () => 'dark' as const);
    const theme = value ?? shown;
    const next: Appearance = theme === 'dark' ? 'light' : 'dark';

    return (
        <button
            type="button"
            aria-label={`Switch to ${next} theme`}
            onPointerEnter={prepareThemeWave}
            onFocus={prepareThemeWave}
            onClick={(e) =>
                themeWave(
                    () => {
                        if (value === undefined) {
                            const root = document.documentElement;
                            root.classList.remove('dark', 'light');
                            root.classList.add(next);
                            try {
                                localStorage.setItem(storageKey, next);
                            } catch {
                                // Storage unavailable (private mode): the choice lasts this visit.
                            }
                        }
                        // Synchronously, effects included: the wave captures the page in the new
                        // theme as soon as this returns.
                        flushSync(() => {
                            onChange?.(next);
                            listeners.forEach((notify) => notify());
                        });
                    },
                    e.currentTarget,
                    target?.current,
                )
            }
            className={cx(
                'zen__theme-toggle text-muted-foreground hover:bg-tint/[0.06] hover:text-foreground focus-visible:ring-ring/50 grid size-9 cursor-pointer place-items-center rounded-lg outline-hidden focus-visible:ring-2',
                className,
            )}
        >
            {theme === 'dark' ? <MoonMicro className="size-4" /> : <SunMicro className="size-4" />}
        </button>
    );
}

export interface ThemeToggleProps {
    /**
     * The theme, when you keep it: the toggle shows it, and `onChange` must apply
     * the new one (by the end of a synchronous render and its effects). Without it,
     * the toggle switches <html>'s class itself.
     */
    value?: Appearance;
    /** Called with the theme switched to. */
    onChange?: (theme: Appearance) => void;
    /**
     * The element whose theme `onChange` switches, when it's not the page (a panel
     * with its own .dark or .light): the wave plays inside it. Needs `value`.
     */
    target?: RefObject<HTMLElement | null>;
    /** localStorage key for the choice, when the toggle keeps it. Use the same one in ThemeScript. */
    storageKey?: string;
    className?: string;
}
