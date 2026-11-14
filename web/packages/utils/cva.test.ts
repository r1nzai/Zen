import { cva } from './cva';

/**
 * cva pipes its output through cx, which prepends spaces before every emitted
 * token and produces double spaces when arrays and strings are mixed.  All
 * assertions use `n()` to collapse runs of whitespace so they read as plain
 * class-name strings.
 */
const n = (s: string) => s.replace(/\s+/g, ' ').trim();

describe('cva', () => {
    // ─── no config ───────────────────────────────────────────────────────────────

    describe('no config', () => {
        it('returns the base class when called with an empty props object', () => {
            const button = cva('btn');
            expect(button({}).trim()).toBe('btn');
        });

        it('returns the base class when called with no props argument', () => {
            const button = cva('btn');
            expect(button().trim()).toBe('btn');
        });

        it('returns empty string when there is no base and no config', () => {
            const empty = cva();
            expect(empty().trim()).toBe('');
        });
    });

    // ─── default variants ────────────────────────────────────────────────────────

    describe('defaultVariants', () => {
        const button = cva('btn', {
            variants: {
                size: { sm: 'text-sm', lg: 'text-lg' },
                intent: { primary: 'bg-blue', secondary: 'bg-gray' },
            },
            defaultVariants: { size: 'sm', intent: 'primary' },
        });

        it('applies all default variants when no props are passed', () => {
            expect(n(button({}))).toBe('btn text-sm bg-blue');
        });

        it('applies the default for a variant whose prop is undefined', () => {
            // size is not provided → falls back to default 'sm'
            expect(n(button({ intent: 'secondary' }))).toBe('btn text-sm bg-gray');
        });

        it('applies defaults when called with no props argument', () => {
            expect(n(button())).toBe('btn text-sm bg-blue');
        });
    });

    // ─── overriding variants ─────────────────────────────────────────────────────

    describe('variant overrides', () => {
        const button = cva('btn', {
            variants: {
                size: { sm: 'text-sm', lg: 'text-lg' },
                intent: { primary: 'bg-blue', secondary: 'bg-gray' },
            },
            defaultVariants: { size: 'sm', intent: 'primary' },
        });

        it('overrides a single variant via props', () => {
            expect(n(button({ size: 'lg' }))).toBe('btn text-lg bg-blue');
        });

        it('overrides both variants at once', () => {
            expect(n(button({ size: 'lg', intent: 'secondary' }))).toBe('btn text-lg bg-gray');
        });

        it('omits the variant class entirely when the variant prop is null', () => {
            // null means "I explicitly want no class for this variant"
            expect(n(button({ size: null }))).toBe('btn bg-blue');
        });

        it('omits both variant classes when both variant props are null', () => {
            expect(n(button({ size: null, intent: null }))).toBe('btn');
        });
    });

    // ─── compound variants ───────────────────────────────────────────────────────

    describe('compoundVariants', () => {
        const button = cva('btn', {
            variants: {
                size: { sm: 'text-sm', lg: 'text-lg' },
                intent: { primary: 'bg-blue', secondary: 'bg-gray' },
            },
            defaultVariants: { size: 'sm', intent: 'primary' },
            compoundVariants: [
                // matches default combination
                { size: 'sm', intent: 'primary', className: 'shadow-sm' },
                // matches an explicitly-set combination
                { size: 'lg', intent: 'secondary', className: 'ring-2' },
            ],
        });

        it('applies a compound variant when the default props satisfy its conditions', () => {
            expect(n(button({}))).toBe('btn text-sm bg-blue shadow-sm');
        });

        it('does not apply a compound variant when one condition fails', () => {
            // size is overridden to 'lg' but intent stays 'primary' — no compound matches
            expect(n(button({ size: 'lg' }))).toBe('btn text-lg bg-blue');
        });

        it('applies the second compound variant when both its conditions are met', () => {
            expect(n(button({ size: 'lg', intent: 'secondary' }))).toBe('btn text-lg bg-gray ring-2');
        });

        it('does not apply any compound variant when a key prop is null', () => {
            // null opt-out means the compound condition size === 'sm' can't match
            expect(n(button({ size: null }))).toBe('btn bg-blue');
        });

        it('supports the `class` key on a compound variant entry', () => {
            const widget = cva('widget', {
                variants: {
                    tone: { loud: 'text-bold', quiet: 'text-normal' },
                },
                defaultVariants: { tone: 'loud' },
                compoundVariants: [{ tone: 'loud', class: 'uppercase' }],
            });

            expect(n(widget({}))).toBe('widget text-bold uppercase');
        });
    });

    // ─── className / class passthrough ───────────────────────────────────────────

    describe('className and class props', () => {
        const button = cva('btn', {
            variants: { size: { sm: 'text-sm', lg: 'text-lg' } },
            defaultVariants: { size: 'sm' },
        });

        it('appends the className prop after variant classes', () => {
            expect(n(button({ className: 'custom-class' }))).toBe('btn text-sm custom-class');
        });

        it('appends the class prop after variant classes', () => {
            expect(n(button({ class: 'custom-class' }))).toBe('btn text-sm custom-class');
        });

        it('passes through className even with no config', () => {
            const bare = cva('base');
            expect(n(bare({ className: 'extra' }))).toBe('base extra');
        });

        it('passes through class even with no config', () => {
            const bare = cva('base');
            expect(n(bare({ class: 'extra' }))).toBe('base extra');
        });

        it('appends className on top of a variant override', () => {
            expect(n(button({ size: 'lg', className: 'mt-2' }))).toBe('btn text-lg mt-2');
        });
    });
});
