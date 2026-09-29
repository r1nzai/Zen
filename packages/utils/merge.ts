/**
 * Resolves Tailwind class conflicts: when two classes set the same property
 * (under the same variants), the later one wins and the earlier one is
 * dropped, so `cx('w-full px-3', className)` with className "w-40 p-1" gives
 * "w-40 p-1". A class that covers several others (p over px, rounded over
 * rounded-t, border over border-t) removes them when it comes later.
 *
 * It knows the core utilities, not every one: classes it doesn't recognise
 * (your own, plugins, zen__ hooks) are always kept, in order.
 */
export function mergeClasses(classes: string): string {
    const cached = cache.get(classes);
    if (cached !== undefined) return cached;

    const tokens = classes.split(/\s+/).filter(Boolean);
    const taken = new Set<string>();
    const kept: string[] = [];
    // Walk from the end: the last class for a property wins.
    for (let i = tokens.length - 1; i >= 0; i--) {
        const token = tokens[i];
        const parsed = parse(token);
        if (!parsed) {
            kept.push(token);
            continue;
        }
        const scope = parsed.scope;
        if (taken.has(scope + parsed.group)) continue;
        taken.add(scope + parsed.group);
        for (const covered of COVERS[parsed.group] ?? []) taken.add(scope + covered);
        kept.push(token);
    }
    const out = kept.reverse().join(' ');

    if (cache.size >= 1000) cache.clear();
    cache.set(classes, out);
    return out;
}

const cache = new Map<string, string>();

/** A class's property group, and the variants and importance it applies under. */
function parse(token: string): { group: string; scope: string } | null {
    const parts = splitVariants(token);
    let base = parts.pop()!;
    let important = false;
    if (base.startsWith('!')) [important, base] = [true, base.slice(1)];
    else if (base.endsWith('!')) [important, base] = [true, base.slice(0, -1)];
    if (base.startsWith('-')) base = base.slice(1);
    const group = groupOf(base);
    if (!group) return null;
    // Variant order doesn't change what a class applies to (hover:focus: = focus:hover:).
    return { group, scope: parts.sort().join(':') + (important ? '!' : '') + '|' };
}

/** Splits "md:hover:[mask:x]" at the colons outside brackets and parentheses. */
function splitVariants(token: string): string[] {
    const parts: string[] = [];
    let depth = 0;
    let start = 0;
    for (let i = 0; i < token.length; i++) {
        const ch = token[i];
        if (ch === '[' || ch === '(') depth++;
        else if (ch === ']' || ch === ')') depth--;
        else if (ch === ':' && depth === 0) {
            parts.push(token.slice(start, i));
            start = i + 1;
        }
    }
    parts.push(token.slice(start));
    return parts;
}

// ── Values ──

const NUMBER = /^\d+(\.\d+)?$/;
const SIZE_NAME = /^(\d?xs|sm|md|lg|\d?xl|base|none|full)$/;
const ARBITRARY_LENGTH =
    /^[[(](length:|size:|percentage:|number:)?(-?[\d.]+[a-z%]*|calc\(|min\(|max\(|clamp\(|var\(--[\w-]*(size|width|radius|spacing|length)[\w-]*\))/;
/** The value without an opacity or line-height modifier ("tint/10" → "tint", "sm/6" → "sm"). */
const bare = (v: string) => v.replace(/\/[^/[\]()]*$/, '');
const isLength = (v: string) => v === '' || NUMBER.test(v) || ARBITRARY_LENGTH.test(v);

// ── Groups ──

const SIDES = ['x', 'y', 't', 'r', 'b', 'l', 's', 'e'];
const CORNERS = ['t', 'r', 'b', 'l', 's', 'e', 'tl', 'tr', 'br', 'bl', 'ss', 'se', 'es', 'ee'];

/** Classes that are the whole utility, no value. */
const EXACT: Record<string, string> = {};
const exact = (group: string, names: string) => names.split(' ').forEach((n) => (EXACT[n] = group));
exact(
    'display',
    'block inline-block inline flex inline-flex grid inline-grid contents hidden flow-root list-item table inline-table table-row table-cell table-caption table-column table-row-group table-header-group table-footer-group',
);
exact('position', 'static fixed absolute relative sticky');
exact('visibility', 'visible invisible collapse');
exact('isolation', 'isolate isolation-auto');
exact('text-overflow', 'truncate text-ellipsis text-clip');
exact('text-transform', 'uppercase lowercase capitalize normal-case');
exact('font-style', 'italic not-italic');
exact('text-decoration-line', 'underline overline line-through no-underline');
exact('font-smoothing', 'antialiased subpixel-antialiased');
exact('sr', 'sr-only not-sr-only');
exact('flex-direction', 'flex-row flex-row-reverse flex-col flex-col-reverse');
exact('flex-wrap', 'flex-wrap flex-wrap-reverse flex-nowrap');
exact('border-style', 'border-solid border-dashed border-dotted border-double border-hidden border-none');
exact('border-collapse', 'border-collapse border-separate');
exact('table-layout', 'table-auto table-fixed');
exact('box-sizing', 'box-border box-content');
exact('grow', 'grow');
exact('shrink', 'shrink');
exact('transition', 'transition');
exact('shadow', 'shadow');
exact('ring-w', 'ring');
exact('ring-inset', 'ring-inset');
exact('outline-w', 'outline');
exact('border-w', 'border');
exact('rounded', 'rounded');
for (const s of SIDES) exact(`border-w-${s}`, `border-${s}`);
for (const c of CORNERS) exact(`rounded-${c}`, `rounded-${c}`);

type Resolve = string | ((value: string) => string | null);

/** "prefix-value" utilities, by prefix; a function picks the group from the value. */
const PREFIXES: Record<string, Resolve> = {
    inset: 'inset',
    'inset-x': 'inset-x',
    'inset-y': 'inset-y',
    top: 'top',
    right: 'right',
    bottom: 'bottom',
    left: 'left',
    start: 'start',
    end: 'end',
    z: 'z',
    order: 'order',
    basis: 'basis',
    grow: 'grow',
    shrink: 'shrink',
    flex: 'flex',
    'grid-cols': 'grid-cols',
    'grid-rows': 'grid-rows',
    'grid-flow': 'grid-flow',
    'auto-cols': 'auto-cols',
    'auto-rows': 'auto-rows',
    col: 'col',
    'col-span': 'col-span',
    'col-start': 'col-start',
    'col-end': 'col-end',
    row: 'row',
    'row-span': 'row-span',
    'row-start': 'row-start',
    'row-end': 'row-end',
    gap: 'gap',
    'gap-x': 'gap-x',
    'gap-y': 'gap-y',
    'space-x': 'space-x',
    'space-y': 'space-y',
    w: 'w',
    'min-w': 'min-w',
    'max-w': 'max-w',
    h: 'h',
    'min-h': 'min-h',
    'max-h': 'max-h',
    size: 'size',
    justify: 'justify-content',
    'justify-items': 'justify-items',
    'justify-self': 'justify-self',
    items: 'align-items',
    self: 'align-self',
    content: (v) => (v === 'none' || v.startsWith('[') || v.startsWith('(') ? 'content' : 'align-content'),
    'place-content': 'place-content',
    'place-items': 'place-items',
    'place-self': 'place-self',
    overflow: 'overflow',
    'overflow-x': 'overflow-x',
    'overflow-y': 'overflow-y',
    'border-spacing': 'border-spacing',
    'border-spacing-x': 'border-spacing-x',
    'border-spacing-y': 'border-spacing-y',
    bg: (v) => {
        const b = bare(v);
        if (['fixed', 'local', 'scroll'].includes(b)) return 'bg-attachment';
        if (/^(clip|origin)-/.test(b)) return 'bg-' + b.split('-')[0];
        if (/^(repeat|no-repeat)/.test(b)) return 'bg-repeat';
        if (['auto', 'cover', 'contain'].includes(b)) return 'bg-size';
        if (/^(top|bottom|left|right|center)/.test(b)) return 'bg-position';
        if (
            b === 'none' ||
            /^(linear|radial|conic|gradient)-/.test(b) ||
            /^\[(url|image:|(repeating-)?(linear|radial|conic)-gradient)/.test(b)
        )
            return 'bg-image';
        return 'bg-color';
    },
    text: (v) => {
        const b = bare(v);
        if (['left', 'center', 'right', 'justify', 'start', 'end'].includes(b)) return 'text-align';
        if (['wrap', 'nowrap', 'balance', 'pretty'].includes(b)) return 'text-wrap';
        if (SIZE_NAME.test(b) || ARBITRARY_LENGTH.test(b)) return 'font-size';
        return 'text-color';
    },
    font: (v) =>
        /^(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/.test(v) || /^[[(](number:|\d)/.test(v)
            ? 'font-weight'
            : 'font-family',
    leading: 'leading',
    tracking: 'tracking',
    whitespace: 'whitespace',
    break: (v) => (['normal', 'words', 'all', 'keep'].includes(v) ? 'word-break' : null),
    'line-clamp': 'line-clamp',
    align: 'vertical-align',
    opacity: 'opacity',
    shadow: (v) =>
        v === '' || SIZE_NAME.test(bare(v)) || v === 'inner' || /^\[(?!color:)/.test(v) ? 'shadow' : 'shadow-color',
    ring: (v) => (isLength(v) ? 'ring-w' : 'ring-color'),
    'ring-offset': (v) => (isLength(v) ? 'ring-offset-w' : 'ring-offset-color'),
    outline: (v) =>
        ['none', 'hidden', 'solid', 'dashed', 'dotted', 'double'].includes(v)
            ? 'outline-style'
            : isLength(v)
              ? 'outline-w'
              : 'outline-color',
    'outline-offset': 'outline-offset',
    cursor: 'cursor',
    'pointer-events': 'pointer-events',
    select: 'user-select',
    resize: 'resize',
    transition: 'transition',
    duration: 'duration',
    ease: 'ease',
    delay: 'delay',
    animate: 'animate',
    scale: 'scale',
    'scale-x': 'scale-x',
    'scale-y': 'scale-y',
    rotate: 'rotate',
    translate: 'translate',
    'translate-x': 'translate-x',
    'translate-y': 'translate-y',
    origin: 'transform-origin',
    fill: 'fill',
    stroke: (v) => (NUMBER.test(v) ? 'stroke-w' : 'stroke-color'),
    aspect: 'aspect',
    object: (v) => (['contain', 'cover', 'fill', 'none', 'scale-down'].includes(v) ? 'object-fit' : 'object-position'),
    blur: 'blur',
    'backdrop-blur': 'backdrop-blur',
    'mix-blend': 'mix-blend',
    appearance: 'appearance',
    'will-change': 'will-change',
    'underline-offset': 'underline-offset',
    accent: 'accent-color',
    caret: 'caret-color',
    float: 'float',
    clear: 'clear',
    columns: 'columns',
    rounded: 'rounded',
    border: (v) => (isLength(v) ? 'border-w' : 'border-color'),
};
for (const p of ['p', 'm']) {
    PREFIXES[p] = p;
    for (const s of SIDES) PREFIXES[p + s] = p + s;
}
for (const s of SIDES) PREFIXES[`border-${s}`] = (v) => (isLength(v) ? `border-w-${s}` : `border-color-${s}`);
for (const c of CORNERS) PREFIXES[`rounded-${c}`] = `rounded-${c}`;

/** Zen's own utilities that share a core prefix but set something else (text-glow is a text shadow). */
const OWN = new Set(['text-glow', 'text-aurora']);

/** Longest prefix first, so "min-w-0" is min-w rather than something shorter. */
const PREFIX_LIST = Object.keys(PREFIXES).sort((a, b) => b.length - a.length);

function groupOf(base: string): string | null {
    if (OWN.has(base)) return null;
    if (EXACT[base]) return EXACT[base];
    // Arbitrary property: [mask-image:…] is its own group, per property.
    if (base.startsWith('[')) {
        const colon = base.indexOf(':');
        return colon > 1 ? 'prop:' + base.slice(1, colon) : null;
    }
    for (const prefix of PREFIX_LIST) {
        if (!base.startsWith(prefix + '-')) continue;
        const resolve = PREFIXES[prefix];
        return typeof resolve === 'string' ? resolve : resolve(base.slice(prefix.length + 1));
    }
    return null;
}

/** Groups that a later class of this group overrides as well. */
const COVERS: Record<string, string[]> = {
    p: SIDES.map((s) => 'p' + s),
    m: SIDES.map((s) => 'm' + s),
    px: ['pl', 'pr', 'ps', 'pe'],
    py: ['pt', 'pb'],
    mx: ['ml', 'mr', 'ms', 'me'],
    my: ['mt', 'mb'],
    inset: ['inset-x', 'inset-y', 'top', 'right', 'bottom', 'left', 'start', 'end'],
    'inset-x': ['left', 'right'],
    'inset-y': ['top', 'bottom'],
    size: ['w', 'h'],
    gap: ['gap-x', 'gap-y'],
    overflow: ['overflow-x', 'overflow-y'],
    'border-spacing': ['border-spacing-x', 'border-spacing-y'],
    'border-w': SIDES.map((s) => 'border-w-' + s),
    'border-w-x': ['border-w-l', 'border-w-r', 'border-w-s', 'border-w-e'],
    'border-w-y': ['border-w-t', 'border-w-b'],
    'border-color': SIDES.map((s) => 'border-color-' + s),
    'border-color-x': ['border-color-l', 'border-color-r', 'border-color-s', 'border-color-e'],
    'border-color-y': ['border-color-t', 'border-color-b'],
    rounded: CORNERS.map((c) => 'rounded-' + c),
    'rounded-t': ['rounded-tl', 'rounded-tr'],
    'rounded-r': ['rounded-tr', 'rounded-br'],
    'rounded-b': ['rounded-br', 'rounded-bl'],
    'rounded-l': ['rounded-tl', 'rounded-bl'],
    'rounded-s': ['rounded-ss', 'rounded-es'],
    'rounded-e': ['rounded-se', 'rounded-ee'],
    translate: ['translate-x', 'translate-y'],
    scale: ['scale-x', 'scale-y'],
    flex: ['grow', 'shrink', 'basis'],
};
