import { currencySymbol, InputGroup, InputGroupAddon, InputGroupInput, Popover, useMoneyInput } from '@rinzai/zen';
import { useState } from 'react';

const CURRENCIES = [
    { code: 'INR', locale: 'en-IN' },
    { code: 'USD', locale: 'en-US' },
    { code: 'EUR', locale: 'de-DE' },
];

/** Build your own field from useMoneyInput: here a currency switcher in the start slot. */
export default function CurrencyMenu() {
    const [currency, setCurrency] = useState(CURRENCIES[0]);
    const [amount, setAmount] = useState<number | null>(3274000);
    const [open, setOpen] = useState(false);
    const money = useMoneyInput({
        value: amount,
        onChange: setAmount,
        currency: currency.code,
        locale: currency.locale,
    });

    return (
        <InputGroup invalid={!!money.error} className="w-64">
            <InputGroupAddon>
                <Popover
                    triggerType="manual"
                    show={open}
                    setShow={setOpen}
                    role="menu"
                    content={
                        <div className="flex w-40 flex-col p-1.5">
                            {CURRENCIES.map((c) => (
                                <button
                                    key={c.code}
                                    role="menuitem"
                                    onClick={() => {
                                        setCurrency(c);
                                        setOpen(false);
                                    }}
                                    className="hover:bg-tint/[0.07] flex items-center justify-between rounded-lg px-3 py-1.5 text-sm"
                                >
                                    {c.code}
                                    <span className="text-muted-foreground">{currencySymbol(c.code, c.locale)}</span>
                                </button>
                            ))}
                        </div>
                    }
                >
                    <button
                        aria-label={`Currency: ${currency.code}`}
                        className="hover:bg-tint/[0.07] text-muted-foreground -ml-1 rounded-md px-1 py-0.5 text-sm"
                    >
                        {money.symbol} ▾
                    </button>
                </Popover>
            </InputGroupAddon>
            <InputGroupInput {...money.inputProps} aria-label="Amount" className="tabular-nums" />
        </InputGroup>
    );
}
