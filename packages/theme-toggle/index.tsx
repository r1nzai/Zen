import MoonMicro from '@zen/icons/micro/moon';
import SunMicro from '@zen/icons/micro/sun';
import { cx } from '@zen/utils/cx';
import { prepareThemeWave, themeWave } from '@zen/utils/theme-wave';
import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

type Theme = 'dark' | 'light';

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
const current = (): Theme => (document.documentElement.classList.contains('light') ? 'light' : 'dark');

/**
 * Switches <html> between the dark and light themes and remembers the choice
 * (localStorage); the new theme spreads from the button like a drop of water (themeWave).
 * Add ThemeScript to <head> to apply it on the next visit.
 */
export default function ThemeToggle({ storageKey = 'theme', className }: ThemeToggleProps) {
    // Dark on the server; the real theme once hydrated.
    const theme = useSyncExternalStore(subscribe, current, () => 'dark' as const);
    const next: Theme = theme === 'dark' ? 'light' : 'dark';

    return (
        <button
            type="button"
            aria-label={`Switch to ${next} theme`}
            onPointerEnter={prepareThemeWave}
            onFocus={prepareThemeWave}
            onClick={(e) =>
                themeWave(() => {
                    const root = document.documentElement;
                    root.classList.remove('dark', 'light');
                    root.classList.add(next);
                    try {
                        localStorage.setItem(storageKey, next);
                    } catch {
                        // Storage unavailable (private mode): the choice lasts this visit.
                    }
                    flushSync(() => listeners.forEach((notify) => notify()));
                }, e.currentTarget)
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
    /** localStorage key for the choice. Use the same one in ThemeScript. */
    storageKey?: string;
    className?: string;
}
