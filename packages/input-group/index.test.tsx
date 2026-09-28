import { fireEvent, render, screen } from '@testing-library/react';

import InputGroup, { InputGroupAddon, InputGroupInput } from './index';

describe('InputGroup', () => {
    it('puts addons around a borderless input, looking like one field', () => {
        const { container } = render(
            <InputGroup>
                <InputGroupAddon>https://</InputGroupAddon>
                <InputGroupInput aria-label="Site" />
                <InputGroupAddon>.com</InputGroupAddon>
            </InputGroup>,
        );
        expect(container.firstChild).toHaveClass('focus-within:border-glow/60', 'rounded-lg');
        expect(screen.getByRole('textbox', { name: 'Site' })).toHaveClass('bg-transparent', 'flex-1');
        expect(container.firstChild).toHaveTextContent('https://.com');
    });

    it("focuses the input when an addon's text is clicked", () => {
        render(
            <InputGroup>
                <InputGroupAddon>₹</InputGroupAddon>
                <InputGroupInput aria-label="Amount" />
            </InputGroup>,
        );
        fireEvent.mouseDown(screen.getByText('₹'));
        expect(screen.getByRole('textbox', { name: 'Amount' })).toHaveFocus();
    });

    it('leaves controls in addons alone', () => {
        const onClick = vi.fn();
        render(
            <InputGroup>
                <InputGroupInput aria-label="Search" />
                <InputGroupAddon>
                    <button onClick={onClick}>Clear</button>
                </InputGroupAddon>
            </InputGroup>,
        );
        const button = screen.getByRole('button', { name: 'Clear' });
        fireEvent.mouseDown(button);
        fireEvent.click(button);
        expect(onClick).toHaveBeenCalled();
        expect(screen.getByRole('textbox')).not.toHaveFocus();
    });

    it('shows the error state', () => {
        const { container } = render(
            <InputGroup invalid>
                <InputGroupInput aria-label="x" />
            </InputGroup>,
        );
        expect(container.firstChild).toHaveAttribute('data-invalid');
        expect(container.firstChild).toHaveClass('border-destructive!');
    });

    it('keeps FIELD_WITHIN in step with FIELD (written out for Tailwind, so check they match)', async () => {
        const { FIELD, FIELD_WITHIN } = await import('../utils/styles');
        const derived = new Set(
            `flex w-full items-center gap-1.5 ${FIELD.replace(/focus-visible:/g, 'focus-within:')}`.split(/\s+/),
        );
        expect(new Set(FIELD_WITHIN.split(/\s+/))).toEqual(derived);
    });
});
