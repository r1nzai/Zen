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

    it('is capped in height, and keeps the typing line in view as tags are added', () => {
        const { input } = setup();
        const box = input.parentElement!;
        expect(box).toHaveClass('max-h-32', 'overflow-y-auto');
        vi.spyOn(box, 'scrollHeight', 'get').mockReturnValue(300);
        input.focus();
        fireEvent.change(input, { target: { value: 'rent' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(box.scrollTop).toBe(300);
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
