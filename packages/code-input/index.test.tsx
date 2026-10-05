import { fireEvent, render, screen } from '@testing-library/react';

import CodeInput from './index';

describe('CodeInput', () => {
    it('keeps only allowed characters, up to the length, and reports the complete code once', () => {
        const onValueChange = vi.fn();
        const onComplete = vi.fn();
        render(<CodeInput aria-label="Code" length={4} onValueChange={onValueChange} onComplete={onComplete} />);
        const input = screen.getByRole('textbox', { name: 'Code' });
        expect(input).toHaveAttribute('autocomplete', 'one-time-code');
        expect(input).toHaveAttribute('inputmode', 'numeric');
        fireEvent.change(input, { target: { value: '1a2-34567' } });
        expect(onValueChange).toHaveBeenLastCalledWith('1234');
        expect(onComplete).toHaveBeenCalledExactlyOnceWith('1234');
        // A box per character, showing it.
        expect(input.parentElement?.querySelectorAll('span[aria-hidden]')).toHaveLength(4);
        expect(input.parentElement).toHaveTextContent('1234');
    });

    it('takes other characters when allowed', () => {
        const onValueChange = vi.fn();
        render(<CodeInput aria-label="Code" length={3} allowed={/[A-Z]/} onValueChange={onValueChange} />);
        const input = screen.getByRole('textbox', { name: 'Code' });
        expect(input).toHaveAttribute('inputmode', 'text');
        fireEvent.change(input, { target: { value: 'Ab1C' } });
        expect(onValueChange).toHaveBeenLastCalledWith('AC');
    });
});
