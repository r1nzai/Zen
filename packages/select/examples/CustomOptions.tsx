import { currencySymbol, Select, SelectItem } from '@rinzai/zen';
import { useState } from 'react';

const CURRENCIES = [
    { value: 'INR', label: 'Indian rupee' },
    { value: 'USD', label: 'US dollar' },
    { value: 'EUR', label: 'Euro' },
    { value: 'JPY', label: 'Japanese yen', disabled: true },
];

/** An item can show anything; its `label` is what the field shows and typing matches. Disabled items are skipped by the keyboard. */
export default function CustomOptions() {
    const [currency, setCurrency] = useState<string | null>(null);
    return (
        <Select
            aria-label="Currency"
            placeholder="Choose a currency"
            value={currency}
            onChange={setCurrency}
            className="w-64"
        >
            {CURRENCIES.map((c) => (
                <SelectItem key={c.value} value={c.value} label={c.label} disabled={c.disabled}>
                    <span className="flex items-center justify-between gap-3">
                        {c.label}
                        <span className="text-muted-foreground tabular-nums">
                            {c.value} {currencySymbol(c.value, 'en')}
                        </span>
                    </span>
                </SelectItem>
            ))}
        </Select>
    );
}
