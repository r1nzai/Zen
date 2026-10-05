import { fireEvent, render, screen } from '@testing-library/react';

import TagInput from './index';

describe('TagInput', () => {
    const setup = (props: Partial<Parameters<typeof TagInput>[0]> = {}) => {
        const onValueChange = vi.fn();
        render(<TagInput aria-label="Labels" defaultValue={['food']} onValueChange={onValueChange} {...props} />);
        return { input: screen.getByRole('textbox', { name: 'Labels' }), onValueChange };
    };

    it('adds a value on Enter or comma, trimmed and once', () => {
        const { input, onValueChange } = setup();
        fireEvent.change(input, { target: { value: ' rent ' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        fireEvent.change(input, { target: { value: 'food' } });
        fireEvent.keyDown(input, { key: ',' });
        expect(onValueChange.mock.calls).toEqual([[['food', 'rent']]]);
        expect(screen.getByText('rent')).toBeInTheDocument();
    });

    it('scrolls only the tags, under a typing line that stays in view', () => {
        const { input } = setup();
        const tags = screen.getByText('food').parentElement!;
        expect(tags).toHaveClass('overflow-y-auto');
        expect(tags).not.toContainElement(input);
        vi.spyOn(tags, 'scrollHeight', 'get').mockReturnValue(300);
        input.focus();
        fireEvent.change(input, { target: { value: 'rent' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(tags.scrollTop).toBe(300);
    });

    it('adds each of a pasted list', () => {
        const { input, onValueChange } = setup();
        fireEvent.paste(input, { clipboardData: { getData: () => 'a, b\nc' } });
        expect(onValueChange).toHaveBeenLastCalledWith(['food', 'a', 'b', 'c']);
    });

    it('takes the last back with Backspace, and removes one with its button', () => {
        const { input, onValueChange } = setup({ defaultValue: ['food', 'rent'] });
        fireEvent.keyDown(input, { key: 'Backspace' });
        expect(onValueChange).toHaveBeenLastCalledWith(['food']);
        expect(input).toHaveValue('rent');
        fireEvent.click(screen.getByRole('button', { name: 'Remove food' }));
        expect(onValueChange).toHaveBeenLastCalledWith([]);
    });

    it('skips what validate refuses', () => {
        const { input, onValueChange } = setup({ validate: (e) => e.includes('@') });
        fireEvent.change(input, { target: { value: 'nope' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(onValueChange).not.toHaveBeenCalled();
    });
});
