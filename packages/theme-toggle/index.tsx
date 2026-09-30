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
            <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="size-4"
                aria-hidden
            >
                {theme === 'dark' ? (
                    <path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7Z" />
                ) : (
                    <>
                        <circle cx="8" cy="8" r="3" />
                        <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06" />
                    </>
                )}
            </svg>
        </button>
    );
}

export interface ThemeToggleProps {
    /** localStorage key for the choice. Use the same one in ThemeScript. */
    storageKey?: string;
    className?: string;
}
