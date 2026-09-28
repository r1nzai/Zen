import { MoneyInput } from '@rinzai/zen';
import { useState } from 'react';

/** Any currency and locale; `allowEmpty` makes an empty field mean null. */
export default function Dollars() {
    const [amount, setAmount] = useState<number | null>(null);
    return (
        <MoneyInput
            aria-label="Budget"
            value={amount}
            onChange={setAmount}
            currency="USD"
            locale="en-US"
            allowEmpty
            className="w-64"
        />
    );
}
