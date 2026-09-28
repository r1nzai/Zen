import { currencySymbol, Select } from '@rinzai/zen';
import { useState } from 'react';

const CURRENCIES = [
    { value: 'INR', label: 'Indian rupee' },
    { value: 'USD', label: 'US dollar' },
    { value: 'EUR', label: 'Euro' },
    { value: 'JPY', label: 'Japanese yen', disabled: true },
];

/** renderOption shows anything per option; disabled options are skipped by the keyboard. */
export default function CustomOptions() {
    const [currency, setCurrency] = useState<string | null>(null);
    return (
        <Select
            aria-label="Currency"
            placeholder="Choose a currency"
            value={currency}
            options={CURRENCIES}
            onChange={setCurrency}
            className="w-64"
            renderOption={(o) => (
                <span className="flex items-center justify-between gap-3">
                    {o.label}
                    <span className="text-muted-foreground tabular-nums">
                        {o.value} {currencySymbol(o.value, 'en')}
                    </span>
                </span>
            )}
        />
    );
}
