import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';

import InputGroup, { InputGroupAddon, InputGroupInput } from '../input-group';
import MoneyInput, { MoneyInputProps, useMoneyInput } from './index';

function Controlled(props: Partial<MoneyInputProps> & { onValue?: (v: number | null) => void }) {
    const [value, setValue] = useState<number | null>(props.value ?? 15200000);
    return (
        <MoneyInput
            aria-label="Amount"
            currency="INR"
            locale="en-IN"
            {...props}
            value={value}
            onChange={(v) => {
                setValue(v);
                props.onValue?.(v);
            }}
        />
    );
}

const input = () => screen.getByRole('textbox', { name: 'Amount' });
const type = (text: string) => fireEvent.change(input(), { target: { value: text } });

describe('MoneyInput', () => {
    it('shows the amount grouped for the locale, with the symbol', () => {
        render(<Controlled />);
        expect(input()).toHaveValue('1,52,000');
        expect(screen.getByText('₹')).toBeInTheDocument();
    });

    it('commits shorthand on blur and tidies the text', () => {
        const onValue = vi.fn();
        render(<Controlled onValue={onValue} />);
        fireEvent.focus(input());
        type('1.5L');
        expect(onValue).not.toHaveBeenCalled();
        fireEvent.blur(input());
        expect(onValue).toHaveBeenCalledWith(15000000);
        expect(input()).toHaveValue('1,50,000');
    });

    it('commits on Enter, and Escape reverts', () => {
        const onValue = vi.fn();
        const onCancel = vi.fn();
        render(<Controlled onValue={onValue} onCancel={onCancel} />);
        type('10k');
        fireEvent.keyDown(input(), { key: 'Enter' });
        expect(onValue).toHaveBeenLastCalledWith(1000000);
        type('999');
        fireEvent.keyDown(input(), { key: 'Escape' });
        expect(input()).toHaveValue('10,000');
        expect(onCancel).toHaveBeenCalled();
    });

    it('explains invalid input and keeps the value', () => {
        const onValue = vi.fn();
        render(<Controlled onValue={onValue} />);
        type('five bananas');
        fireEvent.blur(input());
        expect(onValue).not.toHaveBeenCalled();
        expect(screen.getByRole('alert')).toHaveTextContent('Not an amount. Try 32,740 or 1.5L.');
        expect(input()).toHaveAttribute('aria-invalid', 'true');
        expect(input()).toHaveAccessibleDescription(/Not an amount/);
    });

    it('refuses negatives and empty unless allowed', () => {
        render(<Controlled />);
        type('-50');
        fireEvent.blur(input());
        expect(screen.getByRole('alert')).toHaveTextContent("Amount can't be negative.");
        type('');
        fireEvent.blur(input());
        expect(screen.getByRole('alert')).toHaveTextContent('Enter an amount.');
    });

    it('allows empty (null) and negatives when asked', () => {
        const onValue = vi.fn();
        render(<Controlled allowEmpty allowNegative onValue={onValue} />);
        type('');
        fireEvent.blur(input());
        expect(onValue).toHaveBeenLastCalledWith(null);
        type('-50');
        fireEvent.blur(input());
        expect(onValue).toHaveBeenLastCalledWith(-5000);
    });

    it('live mode reports every keystroke, null while invalid', () => {
        const onValue = vi.fn();
        render(<Controlled live onValue={onValue} />);
        type('12');
        expect(onValue).toHaveBeenLastCalledWith(1200);
        type('12x');
        expect(onValue).toHaveBeenLastCalledWith(null);
    });

    it('uses the locale: dollars in en-US', () => {
        render(<MoneyInput aria-label="Amount" value={15200000} onChange={() => {}} currency="USD" locale="en-US" />);
        expect(input()).toHaveValue('152,000');
        expect(screen.getByText('$')).toBeInTheDocument();
    });

    it('the start slot replaces the symbol', () => {
        render(<Controlled start={<InputGroupAddon>INR ▾</InputGroupAddon>} />);
        expect(screen.getByText('INR ▾')).toBeInTheDocument();
        expect(screen.queryByText('₹')).toBeNull();
    });
});

describe('useMoneyInput', () => {
    it('drives your own field', () => {
        const onChange = vi.fn();
        function Custom() {
            const money = useMoneyInput({ value: null, onChange, currency: 'USD', locale: 'en-US', allowEmpty: true });
            return (
                <InputGroup>
                    <InputGroupInput aria-label="Amount" {...money.inputProps} />
                    <InputGroupAddon>USD</InputGroupAddon>
                </InputGroup>
            );
        }
        render(<Custom />);
        type('2.5k');
        fireEvent.blur(input());
        expect(onChange).toHaveBeenCalledWith(250000);
        expect(input()).toHaveValue('2,500');
    });
});
