import { KeyboardEvent, RefObject, useEffect, useLayoutEffect } from 'react';

import { readingKey } from './direction';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** The enabled elements matching `selector` in `root`, in order, leaving out those of a group nested in it. */
export function rovingItems(root: HTMLElement, selector: string): HTMLElement[] {
    return [...root.querySelectorAll<HTMLElement>(selector)].filter(
        (el) => !el.matches(':disabled') && el.parentElement?.closest('[data-zen-roving]') === root,
    );
}

/**
 * Moves focus between a row's items with the arrow keys (in reading order;
 * ↑↓ for a column), Home and End, wrapping. Returns whether it took the key.
 */
export function moveFocus(
    e: KeyboardEvent<HTMLElement>,
    selector: string,
    orientation: 'horizontal' | 'vertical' = 'horizontal',
): boolean {
    if (e.defaultPrevented) return false;
    const items = rovingItems(e.currentTarget, selector);
    const i = items.indexOf(e.target as HTMLElement);
    if (i === -1) return false;
    const [back, forward] = orientation === 'horizontal' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown'];
    const key = readingKey(e.key, e.currentTarget);
    const to = { [forward]: i + 1, [back]: i - 1, Home: 0, End: items.length - 1 }[key];
    if (to === undefined) return false;
    e.preventDefault();
    items[(to + items.length) % items.length].focus();
    return true;
}

/**
 * Keeps one item of the group at `ref` in the tab order (Tab enters the group
 * once; the arrow keys go through it): the last one focused, else the first
 * matching `preferred` (e.g. the pressed one), else the first. Put
 * data-zen-roving on the group's element. Off (`enabled` false) when an
 * enclosing group, like a Toolbar, roves through the items instead.
 */
export function useRovingTabIndex(
    ref: RefObject<HTMLElement | null>,
    selector: string,
    preferred?: string,
    enabled = true,
) {
    useIsoLayoutEffect(() => {
        const root = ref.current;
        if (!root || !enabled) return;
        const update = (focused?: Element | null) => {
            const items = rovingItems(root, selector);
            const stop =
                items.find((el) => el === focused) ??
                items.find((el) => el.dataset.zenStop !== undefined) ??
                (preferred ? items.find((el) => el.matches(preferred)) : undefined) ??
                items[0];
            for (const el of items) {
                el.tabIndex = el === stop ? 0 : -1;
                if (el === stop) el.dataset.zenStop = '';
                else delete el.dataset.zenStop;
            }
        };
        update(root.contains(document.activeElement) ? document.activeElement : null);
        const onFocus = (e: FocusEvent) => update(e.target as Element);
        root.addEventListener('focusin', onFocus);
        return () => root.removeEventListener('focusin', onFocus);
    });
}
