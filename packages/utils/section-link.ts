import type { MouseEvent } from 'react';

import { reducedMotion } from './motion';

/**
 * Makes an in-page link (`<a href="#id">`) scroll smoothly, as an onClick. The
 * address gets the #id and focus moves to the section, so the keyboard and
 * screen readers carry on from there. Opening in a new tab or window, and
 * links to nothing on the page, are left to the browser.
 */
export function followSectionLink(event: MouseEvent<HTMLAnchorElement>): void {
    if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
    )
        return;
    const { hash } = event.currentTarget;
    const target = hash && document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: reducedMotion() ? 'instant' : 'smooth' });
    // Replaced, not followed: a router would scroll there too, and two scrolls at once
    // cancel each other in Firefox. Back leaves the page, as from anywhere on it.
    history.replaceState(history.state, '', hash);
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
}
