import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Textarea from './index';

// ── helpers ──────────────────────────────────────────────────────────────────

/** Wraps Textarea in local state so controlled behaviour can be tested. */
function ControlledTextarea({
    onChange: onChangeProp,
}: {
    onChange?: (value: string) => void;
}) {
    const [value, setValue] = useState('');
    return (
        <Textarea
            value={value}
            onChange={(e) => {
                setValue(e.target.value);
                onChangeProp?.(e.target.value);
            }}
        />
    );
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('Textarea', () => {
    // ── element ───────────────────────────────────────────────────────────────

    it('renders a <textarea> element', () => {
        render(<Textarea />);
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders a <textarea>, not an <input> or other element', () => {
        render(<Textarea />);
        expect(screen.getByRole('textbox').tagName.toLowerCase()).toBe('textarea');
    });

    // ── placeholder ──────────────────────────────────────────────────────────

    it('forwards the placeholder prop to the underlying textarea', () => {
        render(<Textarea placeholder="Write something…" />);
        expect(screen.getByPlaceholderText('Write something…')).toBeInTheDocument();
    });

    // ── value + onChange ──────────────────────────────────────────────────────

    it('reflects typed characters in a controlled textarea and fires onChange', async () => {
        const user = userEvent.setup();
        const handleChange = vi.fn();

        render(<ControlledTextarea onChange={handleChange} />);

        const textarea = screen.getByRole('textbox');
        await user.type(textarea, 'hello');

        expect(textarea).toHaveValue('hello');
        // onChange fires once per character — 'hello' is 5 keystrokes
        expect(handleChange).toHaveBeenCalledTimes(5);
        expect(handleChange).toHaveBeenLastCalledWith('hello');
    });

    it('fires onChange with the correct intermediate values while typing', async () => {
        const user = userEvent.setup();
        const handleChange = vi.fn();

        render(<ControlledTextarea onChange={handleChange} />);

        await user.type(screen.getByRole('textbox'), 'ab');

        expect(handleChange).toHaveBeenNthCalledWith(1, 'a');
        expect(handleChange).toHaveBeenNthCalledWith(2, 'ab');
    });

    it('accepts a fireEvent.change call and forwards the event', () => {
        const handleChange = vi.fn();
        render(<Textarea onChange={handleChange} />);
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } });
        expect(handleChange).toHaveBeenCalledTimes(1);
    });

    // ── disabled ──────────────────────────────────────────────────────────────

    it('is disabled when the disabled prop is set', () => {
        render(<Textarea disabled />);
        expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('does not receive user input when disabled', async () => {
        const user = userEvent.setup();
        const handleChange = vi.fn();
        render(<Textarea disabled onChange={handleChange} />);
        await user.type(screen.getByRole('textbox'), 'hello');
        expect(handleChange).not.toHaveBeenCalled();
    });

    // ── className forwarding ──────────────────────────────────────────────────

    it('merges a custom className alongside the built-in classes', () => {
        const { container } = render(<Textarea className="my-textarea" />);
        const el = container.firstChild as HTMLElement;
        expect(el).toHaveClass('my-textarea');
        // one of the fixed base classes is always present
        expect(el).toHaveClass('border-input');
    });

    it('custom className does not strip core layout classes', () => {
        const { container } = render(<Textarea className="ring-2" />);
        const el = container.firstChild as HTMLElement;
        expect(el).toHaveClass('ring-2');
        expect(el).toHaveClass('w-full');
    });
});
