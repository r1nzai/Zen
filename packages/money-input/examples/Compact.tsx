import { MoneyInput } from '@rinzai/zen';
import { useState } from 'react';

/** `compact`: shorter and right-aligned, for editing inside table rows. */
export default function Compact() {
    const [amount, setAmount] = useState<number | null>(1640000);
    return (
        <MoneyInput
            compact
            aria-label="Groceries"
            value={amount}
            onChange={setAmount}
            currency="INR"
            locale="en-IN"
            className="w-36"
        />
    );
}
