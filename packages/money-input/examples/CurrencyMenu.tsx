import {
    currencySymbol,
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    Menu,
    MenuContent,
    MenuItem,
    MenuTrigger,
    useMoneyInput,
} from '@rinzai/zen';
import { useState } from 'react';

const CURRENCIES = [
    { code: 'INR', locale: 'en-IN' },
    { code: 'USD', locale: 'en-US' },
    { code: 'EUR', locale: 'de-DE' },
];

/** Build your own field from useMoneyInput: here a currency switcher (a Menu) in the start slot. */
export default function CurrencyMenu() {
    const [currency, setCurrency] = useState(CURRENCIES[0]);
    const [amount, setAmount] = useState<number | null>(3274000);
    const money = useMoneyInput({
        value: amount,
        onChange: setAmount,
        currency: currency.code,
        locale: currency.locale,
    });

    return (
        <InputGroup invalid={!!money.error} className="w-64">
            <InputGroupAddon>
                <Menu>
                    <MenuTrigger
                        aria-label={`Currency: ${currency.code}`}
                        className="hover:bg-tint/[0.07] text-muted-foreground -ml-1 rounded-md px-1 py-0.5 text-sm"
                    >
                        {money.symbol} ▾
                    </MenuTrigger>
                    <MenuContent align="start" className="w-40 min-w-0">
                        {CURRENCIES.map((c) => (
                            <MenuItem key={c.code} onSelect={() => setCurrency(c)} className="justify-between">
                                {c.code}
                                <span className="text-muted-foreground">{currencySymbol(c.code, c.locale)}</span>
                            </MenuItem>
                        ))}
                    </MenuContent>
                </Menu>
            </InputGroupAddon>
            <InputGroupInput {...money.inputProps} aria-label="Amount" className="tabular-nums" />
        </InputGroup>
    );
}
