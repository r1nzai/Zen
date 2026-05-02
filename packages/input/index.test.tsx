import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Input from './index';

// ── helpers ──────────────────────────────────────────────────────────────────

/** Wraps Input in local state so controlled behaviour can be tested. */
function ControlledInput({
    onChange: onChangeProp,
}: {
    onChange?: (value: string) => void;
}) {
    const [value, setValue] = useState('');
    return (
        <Input
            value={value}
            onChange={(e) => {
                setValue(e.target.value);
                onChangeProp?.(e.target.value);
            }}
        />
    );
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('Input', () => {
    // ── element ───────────────────────────────────────────────────────────────

    it('renders an <input> element', () => {
        render(<Input />);
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders an <input>, not a <textarea> or other element', () => {
        render(<Input />);
        expect(screen.getByRole('textbox').tagName.toLowerCase()).toBe('input');
    });

    // ── placeholder ──────────────────────────────────────────────────────────

    it('forwards the placeholder prop to the underlying input', () => {
        render(<Input placeholder="Enter value" />);
        expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument();
    });

    // ── value + onChange ──────────────────────────────────────────────────────

    it('reflects typed characters in a controlled input and fires onChange', async () => {
        const user = userEvent.setup();
        const handleChange = vi.fn();

        render(<ControlledInput onChange={handleChange} />);

        const input = screen.getByRole('textbox');
        await user.type(input, 'hello');

        expect(input).toHaveValue('hello');
        // onChange fires once per character — 'hello' is 5 keystrokes
        expect(handleChange).toHaveBeenCalledTimes(5);
        expect(handleChange).toHaveBeenLastCalledWith('hello');
    });

    it('fires onChange with the correct intermediate values while typing', async () => {
        const user = userEvent.setup();
        const handleChange = vi.fn();

        render(<ControlledInput onChange={handleChange} />);

        await user.type(screen.getByRole('textbox'), 'ab');

        expect(handleChange).toHaveBeenNthCalledWith(1, 'a');
        expect(handleChange).toHaveBeenNthCalledWith(2, 'ab');
    });

    it('accepts a fireEvent.change call and forwards the event', () => {
        const handleChange = vi.fn();
        render(<Input onChange={handleChange} />);
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } });
        expect(handleChange).toHaveBeenCalledTimes(1);
    });

    // ── disabled ──────────────────────────────────────────────────────────────

    it('is disabled when the disabled prop is set', () => {
        render(<Input disabled />);
        expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('does not receive user input when disabled', async () => {
        const user = userEvent.setup();
        const handleChange = vi.fn();
        render(<Input disabled onChange={handleChange} />);
        await user.type(screen.getByRole('textbox'), 'hello');
        expect(handleChange).not.toHaveBeenCalled();
    });

    // ── readOnly ──────────────────────────────────────────────────────────────

    it('has the readonly attribute when the readOnly prop is set', () => {
        render(<Input readOnly />);
        expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    });

    it('does not update value through user typing when readOnly', async () => {
        const user = userEvent.setup();
        const handleChange = vi.fn();
        render(<Input readOnly value="fixed" onChange={handleChange} />);
        await user.type(screen.getByRole('textbox'), 'extra');
        expect(handleChange).not.toHaveBeenCalled();
        expect(screen.getByRole('textbox')).toHaveValue('fixed');
    });

    // ── className forwarding ──────────────────────────────────────────────────

    it('merges a custom className alongside the built-in classes', () => {
        const { container } = render(<Input className="my-input" />);
        const el = container.firstChild as HTMLElement;
        expect(el).toHaveClass('my-input');
        // one of the fixed base classes is always present
        expect(el).toHaveClass('border-input');
    });

    it('custom className does not strip core layout classes', () => {
        const { container } = render(<Input className="ring-2" />);
        const el = container.firstChild as HTMLElement;
        expect(el).toHaveClass('ring-2');
        expect(el).toHaveClass('w-full');
    });
});
