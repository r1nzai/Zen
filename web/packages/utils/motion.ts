/** Whether to skip motion: the OS setting, or an app's own switch (html.reduce-motion). */
export function reducedMotion(): boolean {
    return (
        typeof window !== 'undefined' &&
        (!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
            document.documentElement.classList.contains('reduce-motion'))
    );
}

/** theme.css's --ease-out-soft, for the Web Animations API (which can't read a custom property). */
export const EASE_OUT_SOFT = 'cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * A damped spring (mass 1) settling from 0 to 1: where it is `t` seconds in. theme.css's
 * --ease-spring* are these drawn as linear() curves; Motion.kt computes the same.
 */
export function springAt(stiffness: number, damping: number, t: number): number {
    const w = Math.sqrt(stiffness);
    const z = damping / (2 * w);
    const wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
}

/** Zen's springs, as stiffness and damping, with how long each takes to settle (ms). */
export const SPRING = { stiffness: 380, damping: 34, ms: 450 } as const;
export const SPRING_POP = { stiffness: 500, damping: 18, ms: 770 } as const;
export const SPRING_STACK = { stiffness: 320, damping: 30, ms: 490 } as const;
