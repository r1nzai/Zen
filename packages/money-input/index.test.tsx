import { act, fireEvent, render, screen } from '@testing-library/react';
import { StrictMode, useState } from 'react';

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

describe('MoneyInput convert', () => {
    const TABLE = { base: 'EUR', date: '2026-09-29', rates: { INR: 100, USD: 1.25 } };
    // 1 USD = 80 INR.
    function Converting(
        props: Partial<MoneyInputProps> & {
            onValue?: (v: number | null) => void;
            onForeign?: (f: unknown) => void;
            load?: () => unknown;
        },
    ) {
        const [value, setValue] = useState<number | null>(props.value ?? null);
        return (
            <MoneyInput
                aria-label="Amount"
                currency="INR"
                locale="en-IN"
                allowEmpty
                {...props}
                value={value}
                onChange={(v) => {
                    setValue(v);
                    props.onValue?.(v);
                }}
                convert={{
                    currencies: ['USD', 'GBP'],
                    loadRates: (props.load as never) ?? (() => Promise.resolve(TABLE)),
                    source: 'ECB',
                    onForeign: props.onForeign,
                }}
            />
        );
    }
    const pick = async (code: string) => {
        fireEvent.click(screen.getByRole('button', { name: /^Currency:/ }));
        fireEvent.click(screen.getByRole('menuitem', { name: new RegExp(`^${code}`), hidden: true }));
    };

    it('offers only currencies the rates have, once loaded', async () => {
        render(<Converting />);
        await pick('USD');
        await screen.findByText(/1 USD = ₹80\.00 \(ECB/);
        fireEvent.click(screen.getByRole('button', { name: /^Currency:/ }));
        expect(screen.queryByRole('menuitem', { name: /^GBP/, hidden: true })).toBeNull();
        expect(screen.getByRole('menuitem', { name: /^INR/, hidden: true })).toBeInTheDocument();
    });

    it('converts on commit and keeps the original', async () => {
        const onValue = vi.fn();
        const onForeign = vi.fn();
        render(<Converting onValue={onValue} onForeign={onForeign} />);
        await pick('USD');
        await screen.findByText(/1 USD =/);
        type('10');
        expect(screen.getByText(/≈ ₹800\.00/)).toBeInTheDocument();
        fireEvent.blur(input());
        expect(onValue).toHaveBeenLastCalledWith(80000);
        expect(onForeign).toHaveBeenLastCalledWith({ currency: 'USD', amount: 1000, rate: 80, date: '2026-09-29' });
        expect(input()).toHaveValue('800');
        expect(input()).toHaveAccessibleDescription(/Converted from \$10\.00 at 80\.0000/);
    });

    it('live mode reports the converted amount, and only once the rate is here', async () => {
        const onValue = vi.fn();
        let resolve: (t: typeof TABLE) => void = () => {};
        const load = () => new Promise((r) => (resolve = r));
        render(<Converting live onValue={onValue} load={load} />);
        type('10');
        expect(onValue).toHaveBeenLastCalledWith(1000);
        await pick('USD');
        expect(onValue).toHaveBeenLastCalledWith(null);
        expect(screen.getByText(/Getting today’s rate/)).toBeInTheDocument();
        await act(async () => resolve(TABLE));
        expect(onValue).toHaveBeenLastCalledWith(80000);
    });

    it("won't commit without a rate, and says why", async () => {
        const onValue = vi.fn();
        render(<Converting onValue={onValue} load={() => null} />);
        await pick('USD');
        await screen.findByText(/Couldn’t get exchange rates/);
        type('10');
        fireEvent.blur(input());
        expect(onValue).not.toHaveBeenCalled();
        expect(screen.getByRole('alert')).toHaveTextContent("Couldn't get today's exchange rate.");
    });

    it('Escape goes back to the home currency', async () => {
        render(<Converting value={5000} />);
        await pick('USD');
        type('10');
        fireEvent.keyDown(input(), { key: 'Escape' });
        expect(input()).toHaveValue('50');
        expect(screen.getByRole('button', { name: /^Currency: INR/ })).toBeInTheDocument();
    });

    it('loads the rate under StrictMode (effects mounted twice)', async () => {
        render(
            <StrictMode>
                <Converting />
            </StrictMode>,
        );
        await pick('USD');
        expect(await screen.findByText(/1 USD = ₹80\.00/)).toBeInTheDocument();
    });

    it('opens on a saved foreign amount', async () => {
        render(
            <MoneyInput
                aria-label="Amount"
                value={80000}
                onChange={() => {}}
                currency="INR"
                locale="en-IN"
                convert={{
                    currencies: ['USD'],
                    loadRates: () => TABLE,
                    initial: { currency: 'USD', amount: 1000, rate: 80, date: '2026-09-29' },
                }}
            />,
        );
        expect(input()).toHaveValue('10');
        expect(await screen.findByText(/1 USD = ₹80\.00/)).toBeInTheDocument();
    });
});
