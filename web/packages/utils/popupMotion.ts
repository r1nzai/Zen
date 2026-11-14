import { EASE_OUT_SOFT, reducedMotion, SPRING, springAt } from './motion';

/*
 * A popup opening against its trigger: it grows out of the edge facing the trigger, from 0.86 × 0.72
 * and 10px nearer, on the settling spring: it lands on its size without bouncing (the pop spring's
 * wobble read as childish). It's there within 150ms. In a popup opened now and then (data-zen-rows:
 * a popover, a picker) its rows drop in after it, 45ms apart; a menu or list, opened all day, comes
 * in whole, as Apple's guidelines keep motion off frequent interactions. Shutting is quick: it fades in 130ms,
 * pulling back toward the trigger. One popup can take another's place (handOff), moving on from it as one
 * panel, as Apple asks of one popover at a time. Popup.kt does the same.
 */
const FROM_ALONG = 0.86;
const FROM_ACROSS = 0.72;
const NEARER = 10;
const ROW_DROP = 8;
const ROW_GAP = 45;
/** Rows after this many come with the last: a long list doesn't keep arriving. */
const ROW_CAP = 6;

const grow = `linear(${Array.from({ length: 41 }, (_, i) =>
    i === 40 ? 1 : +springAt(SPRING.stiffness, SPRING.damping, (i / 40) * (SPRING.ms / 1000)).toFixed(4),
).join(', ')})`;

const ID = 'zen-popup-motion';

/** When each popup last opened: until it has grown in, what arrives in it is part of the opening. */
const openedAt = new WeakMap<HTMLElement, number>();

/** Popups opening in another's place (handOff): the box they start from, that one's contents, and which way they go. */
const handedTo = new WeakMap<HTMLElement, { from: DOMRect; ghost: HTMLElement; dir: number }>();
/** The contents a popup moved on from, shown in it as they go. */
const ghosts = new WeakMap<HTMLElement, HTMLElement>();
/** Popups giving way to another: they go at once, the other taking their place. */
const givingWay = new WeakSet<HTMLElement>();

/**
 * `to` opens where `from` is and `from` goes at once, as one panel moving on: `to` eases from
 * `from`'s place and size to its own as its contents take over from `from`'s, sliding the way it
 * goes (a NavigationMenu's panels, one for each label). Call it just before opening `to`.
 */
export function handOff(from: HTMLElement, to: HTMLElement) {
    if (reducedMotion()) return;
    const [a, b] = [triggerOf(from), triggerOf(to)].map((t) => t?.getBoundingClientRect());
    const dir = a && b ? Math.sign(b.left + b.width / 2 - (a.left + a.width / 2)) : 0;
    handedTo.set(to, { from: from.getBoundingClientRect(), ghost: ghostOf(from), dir });
    givingWay.add(from);
}

/** A still copy of a popup's contents, laid out as they were but without its glass, for another to show as they go. */
function ghostOf(popup: HTMLElement): HTMLElement {
    const ghost = popup.cloneNode(true) as HTMLElement;
    for (const name of ['id', 'popover', 'role', 'style', 'aria-labelledby', 'aria-label', 'data-popup-open'])
        ghost.removeAttribute(name);
    // Not a popover now: the popovers' rules (hidden while not open) would hide it.
    ghost.classList.remove('zen__popover');
    ghost.inert = true;
    ghost.setAttribute('aria-hidden', 'true');
    const { width, height } = popup.getBoundingClientRect();
    const set = (name: string, value: string) => ghost.style.setProperty(name, value, 'important');
    set('position', 'absolute');
    set('inset', 'auto');
    set('margin', '0');
    set('width', `${width}px`);
    set('height', `${height}px`);
    set('background', 'none');
    set('border-color', 'transparent');
    set('box-shadow', 'none');
    set('backdrop-filter', 'none');
    set('pointer-events', 'none');
    return ghost;
}

function dropGhost(popup: HTMLElement) {
    ghosts.get(popup)?.remove();
    ghosts.delete(popup);
}

function triggerOf(popup: HTMLElement): HTMLElement | null {
    const id = popup.style.getPropertyValue('--zen-anchor').trim();
    return id ? document.querySelector<HTMLElement>(`[data-zen-anchor="${id}"]`) : null;
}

function moves(popup: HTMLElement) {
    return (
        !!triggerOf(popup) &&
        popup.getAttribute('role') !== 'tooltip' &&
        getComputedStyle(popup).getPropertyValue('--zen-sheet').trim() !== '1' &&
        !reducedMotion()
    );
}

/** The rows: the first level inside the popup holding more than one element. */
function rowsOf(popup: HTMLElement): Element[] {
    let at: Element = popup;
    while (at.childElementCount === 1) at = at.firstElementChild!;
    return [...at.children];
}

/** Which way the trigger is from the popup, and the point on the popup's facing edge nearest it. */
function facing(popup: HTMLElement, trigger: HTMLElement) {
    const p = popup.getBoundingClientRect();
    const t = trigger.getBoundingClientRect();
    const clamp = (v: number, max: number) => Math.min(Math.max(v, 0), max);
    const x = clamp(t.left + t.width / 2 - p.left, p.width);
    const y = clamp(t.top + t.height / 2 - p.top, p.height);
    if (p.top >= t.bottom - 1) return { origin: `${x}px 0`, dx: 0, dy: -1 };
    if (p.bottom <= t.top + 1) return { origin: `${x}px 100%`, dx: 0, dy: 1 };
    return p.left >= t.left + t.width / 2
        ? { origin: `0 ${y}px`, dx: -1, dy: 0 }
        : { origin: `100% ${y}px`, dx: 1, dy: 0 };
}

function cancel(el: Element) {
    for (const a of el.getAnimations()) if (a.id === ID) a.cancel();
}

function run(el: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) {
    el.animate(keyframes, options).id = ID;
}

function open(popup: HTMLElement) {
    const trigger = triggerOf(popup);
    cancel(popup);
    openedAt.set(popup, performance.now());
    const handed = handedTo.get(popup);
    handedTo.delete(popup);
    if (handed) return moveOn(popup, handed.from, handed.ghost, handed.dir);
    if (!trigger) return;
    const { origin, dx, dy } = facing(popup, trigger);
    const [sx, sy] = dy ? [FROM_ALONG, FROM_ACROSS] : [FROM_ACROSS, FROM_ALONG];
    popup.style.transformOrigin = origin;
    run(
        popup,
        [{ transform: `translate(${dx * NEARER}px, ${dy * NEARER}px) scale(${sx}, ${sy})` }, { transform: 'none' }],
        {
            duration: SPRING.ms,
            easing: grow,
        },
    );
    run(popup, [{ opacity: 0 }, { opacity: 1 }], { duration: 150 });
    if (popup.hasAttribute('data-zen-rows')) dropRows(popup, dx, dy);
}

/** How long a change in an open popup's size, or a move to another's place, takes. */
const RESIZE_MS = 220;
/** Moving on, how far the contents slide the way it goes; the old ones are gone by OUT_MS, the new start at IN_AT. Popup.kt's are the same. */
const SWAP_SHIFT = 12;
const SWAP_OUT_MS = 100;
const SWAP_IN_AT = 60;

/**
 * Opens in the place of the popup that was at `from`: eases to its own place and size as `ghost`,
 * its old contents, fades out and its own fade in, both sliding `dir` (-1, 0, 1) the way it goes.
 */
function moveOn(popup: HTMLElement, from: DOMRect, ghost: HTMLElement, dir: number) {
    const to = popup.getBoundingClientRect();
    popup.style.transformOrigin = '0 0';
    run(
        popup,
        [
            {
                transform: `translate(${from.left - to.left}px, ${from.top - to.top}px)`,
                width: `${from.width}px`,
                height: `${from.height}px`,
            },
            { transform: 'none', width: `${to.width}px`, height: `${to.height}px` },
        ],
        { duration: RESIZE_MS, easing: EASE_OUT_SOFT },
    );
    // Its contents clipped to it while it moves (set, not animated: see resizing).
    popup.style.overflow = 'clip';
    setTimeout(() => (popup.style.overflow = ''), RESIZE_MS);
    const shift = dir * SWAP_SHIFT;
    for (const child of popup.children) {
        run(child, [{ opacity: 0 }, { opacity: 1 }], {
            duration: RESIZE_MS - SWAP_IN_AT,
            delay: SWAP_IN_AT,
            easing: EASE_OUT_SOFT,
            fill: 'backwards',
        });
        run(child, [{ translate: `${shift}px 0` }, { translate: '0 0' }], {
            duration: RESIZE_MS,
            easing: EASE_OUT_SOFT,
        });
    }
    // Where the old contents were: at the popup's top-left corner, inside its border.
    dropGhost(popup);
    ghost.style.setProperty('left', `${-popup.clientLeft}px`, 'important');
    ghost.style.setProperty('top', `${-popup.clientTop}px`, 'important');
    popup.append(ghost);
    ghosts.set(popup, ghost);
    run(ghost, [{ opacity: 1 }, { opacity: 0 }], { duration: SWAP_OUT_MS, easing: EASE_OUT_SOFT, fill: 'forwards' });
    ghost.animate([{ translate: '0 0' }, { translate: `${-shift}px 0` }], {
        duration: RESIZE_MS,
        easing: EASE_OUT_SOFT,
    }).onfinish = () => {
        if (ghosts.get(popup) === ghost) dropGhost(popup);
    };
}

/** The last row lands this long after opening; rows arriving by then still take their turn. */
const ROWS_END = 30 + ROW_CAP * ROW_GAP + 260;
const arriving = new WeakMap<HTMLElement, MutationObserver>();

/**
 * Drops the popup's rows in, each at its turn after the opening. Content rendered once it's open
 * (a date picker's calendar, there only while open) comes a frame or two late: it's watched for
 * until the last row lands, and late rows join at their place, part way through if their turn has
 * begun, as Popup.kt's rows keep to one clock.
 */
function dropRows(popup: HTMLElement, dx: number, dy: number) {
    const start = performance.now();
    const dropped = new WeakSet<Element>();
    const drop = () =>
        rowsOf(popup).forEach((row, i) => {
            if (dropped.has(row)) return;
            dropped.add(row);
            cancel(row);
            run(
                row,
                [
                    { opacity: 0, transform: `translate(${dx * ROW_DROP}px, ${dy * ROW_DROP}px)` },
                    { opacity: 1, transform: 'none' },
                ],
                {
                    duration: 260,
                    delay: 30 + Math.min(i, ROW_CAP) * ROW_GAP - (performance.now() - start),
                    easing: EASE_OUT_SOFT,
                    fill: 'backwards',
                },
            );
        });
    drop();
    stopArriving(popup);
    const observer = new MutationObserver(() => (performance.now() - start > ROWS_END ? stopArriving(popup) : drop()));
    observer.observe(popup, { childList: true, subtree: true });
    arriving.set(popup, observer);
}

function stopArriving(popup: HTMLElement) {
    arriving.get(popup)?.disconnect();
    arriving.delete(popup);
}

function shut(popup: HTMLElement) {
    const trigger = triggerOf(popup);
    cancel(popup);
    stopArriving(popup);
    dropGhost(popup);
    for (const row of rowsOf(popup)) cancel(row);
    if (givingWay.delete(popup) || !trigger) return;
    const { origin, dx, dy } = facing(popup, trigger);
    const [sx, sy] = dy ? [0.92, 0.86] : [0.86, 0.92];
    popup.style.transformOrigin = origin;
    run(
        popup,
        [{ transform: 'none' }, { transform: `translate(${dx * ROW_DROP}px, ${dy * ROW_DROP}px) scale(${sx}, ${sy})` }],
        {
            duration: 180,
            easing: EASE_OUT_SOFT,
            fill: 'forwards',
        },
    );
    run(popup, [{ opacity: 1 }, { opacity: 0 }], { duration: 130, fill: 'forwards' });
}

/**
 * Eases an open popup from its old size to its new one when what it holds changes (a list filtering
 * as you type, a month with another week): it grows or shrinks rather than jumping, as Apple's
 * guidelines ask of a popover. Returns what stops it.
 */
function resizing(popup: HTMLElement) {
    let last = { w: 0, h: 0 };
    let easing: Animation | null = null;
    const observer = new ResizeObserver(([entry]) => {
        // Its own frames, while it eases; it measures again once done, and eases on from there if it changed meanwhile.
        if (easing) return;
        const box = entry.borderBoxSize[0];
        const was = last;
        last = { w: box.inlineSize, h: box.blockSize };
        const opening = performance.now() - (openedAt.get(popup) ?? 0) < SPRING.ms;
        if (!was.w || !last.w || (was.w === last.w && was.h === last.h) || opening || !moves(popup)) return;
        easing = popup.animate(
            {
                width: [`${was.w}px`, `${last.w}px`],
                height: [`${was.h}px`, `${last.h}px`],
            },
            { duration: RESIZE_MS, easing: EASE_OUT_SOFT },
        );
        easing.id = ID;
        // Its contents clipped to it only while it eases, so nothing is cut once it has its size.
        // Set, not animated: Chrome's renderer crashes animating overflow on some popups.
        popup.style.overflow = 'clip';
        easing.onfinish = easing.oncancel = () => {
            easing = null;
            popup.style.overflow = '';
        };
    });
    observer.observe(popup);
    return () => observer.disconnect();
}

/** Moves `popup` as it opens, shuts and changes size. Returns what stops it. */
export function popupMotion(popup: HTMLElement) {
    const before = (e: Event) => {
        if (!moves(popup)) return;
        if ((e as ToggleEvent).newState === 'open') {
            // Held unseen until it's placed and measured (the toggle event can come after a frame).
            cancel(popup);
            run(popup, [{ opacity: 0 }, { opacity: 0 }], { duration: 1000, fill: 'forwards' });
        } else shut(popup);
    };
    const after = (e: Event) => {
        if ((e as ToggleEvent).newState === 'open' && moves(popup)) open(popup);
    };
    popup.addEventListener('beforetoggle', before);
    popup.addEventListener('toggle', after);
    const stopResizing = resizing(popup);
    return () => {
        popup.removeEventListener('beforetoggle', before);
        popup.removeEventListener('toggle', after);
        stopResizing();
        stopArriving(popup);
        dropGhost(popup);
    };
}
