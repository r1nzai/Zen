import { RefObject, useLayoutEffect } from 'react';

/**
 * Keeps a fixed bar's height in a CSS variable on its parent (0px while the bar
 * is hidden), so the bars and the page beside it can stack on it and pad for it.
 */
export function useHeightVar(ref: RefObject<HTMLElement | null>, name: `--${string}`) {
    useLayoutEffect(() => {
        const el = ref.current;
        const parent = el?.parentElement;
        if (!el || !parent) return;
        const set = () => parent.style.setProperty(name, `${el.offsetHeight}px`);
        set();
        const observer = new ResizeObserver(set);
        observer.observe(el);
        return () => {
            observer.disconnect();
            parent.style.removeProperty(name);
        };
    }, [ref, name]);
}
