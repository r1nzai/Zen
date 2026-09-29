import { cx } from './cx';
import { mergeClasses as m } from './merge';

describe('mergeClasses', () => {
    it('keeps the last class for a property', () => {
        expect(m('w-full w-40')).toBe('w-40');
        expect(m('px-3 px-5')).toBe('px-5');
        expect(m('text-sm text-xs')).toBe('text-xs');
        expect(m('block hidden')).toBe('hidden');
        expect(m('relative absolute')).toBe('absolute');
    });

    it('keeps classes that set different properties', () => {
        expect(m('w-full h-9 px-3 py-2')).toBe('w-full h-9 px-3 py-2');
        expect(m('text-sm text-primary text-right')).toBe('text-sm text-primary text-right');
        expect(m('border border-tint/10 border-dashed')).toBe('border border-tint/10 border-dashed');
        expect(m('bg-primary bg-[linear-gradient(to_bottom,white,transparent)]')).toBe(
            'bg-primary bg-[linear-gradient(to_bottom,white,transparent)]',
        );
        expect(m('ring-2 ring-ring/40')).toBe('ring-2 ring-ring/40');
        expect(m('shadow-lg shadow-glow/30')).toBe('shadow-lg shadow-glow/30');
        expect(m('font-medium font-mono')).toBe('font-medium font-mono');
        expect(m('flex flex-col flex-1 flex-wrap')).toBe('flex flex-col flex-1 flex-wrap');
        expect(m('outline-hidden outline-2 outline-ring')).toBe('outline-hidden outline-2 outline-ring');
    });

    it('lets a broader class override narrower ones before it, not after', () => {
        expect(m('px-3 py-1 p-2')).toBe('p-2');
        expect(m('p-2 px-3')).toBe('p-2 px-3');
        expect(m('rounded-t-lg rounded-md')).toBe('rounded-md');
        expect(m('border-t-2 border-0')).toBe('border-0');
        expect(m('w-4 h-4 size-6')).toBe('size-6');
        expect(m('top-0 left-2 inset-0')).toBe('inset-0');
    });

    it('treats each set of variants separately', () => {
        expect(m('p-2 md:p-4 hover:bg-muted bg-card')).toBe('p-2 md:p-4 hover:bg-muted bg-card');
        expect(m('md:p-2 md:p-4')).toBe('md:p-4');
        expect(m('hover:focus:bg-muted focus:hover:bg-card')).toBe('focus:hover:bg-card');
        expect(m('!p-2 p-4')).toBe('!p-2 p-4');
        expect(m('p-2! p-4!')).toBe('p-4!');
    });

    it('handles arbitrary values and properties', () => {
        expect(m('text-[0.65rem] text-xs')).toBe('text-xs');
        expect(m('text-[0.65rem] text-[oklch(var(--x)/0.5)]')).toBe('text-[0.65rem] text-[oklch(var(--x)/0.5)]');
        expect(m('w-[28rem] w-[60rem]')).toBe('w-[60rem]');
        expect(m('[mask:none] [mask:url(x)] [color:red]')).toBe('[mask:url(x)] [color:red]');
        expect(m('group-hover:[background-image:none] group-hover:[background-image:x]')).toBe(
            'group-hover:[background-image:x]',
        );
        expect(m('-mt-2 mt-4')).toBe('mt-4');
    });

    it('keeps classes it does not know, in order', () => {
        expect(m('zen__card glass glow-edge group rise text-glow text-primary')).toBe(
            'zen__card glass glow-edge group rise text-glow text-primary',
        );
        expect(m('card-title card-title')).toBe('card-title card-title');
    });

    it('drops extra whitespace', () => {
        expect(m('  a   b ')).toBe('a b');
        expect(m('')).toBe('');
    });
});

describe('cx merges', () => {
    it("lets a className override a component's defaults", () => {
        expect(cx('zen__avatar size-9 rounded-full text-sm', 'size-16 text-xl')).toBe(
            'zen__avatar rounded-full size-16 text-xl',
        );
        expect(cx('w-full', { 'w-40': true })).toBe('w-40');
    });
});
