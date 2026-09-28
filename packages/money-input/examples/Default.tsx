import { formatMoney, MoneyInput } from '@rinzai/zen';
import { useState } from 'react';

/** Try 1.5L, 2cr, 10k or 1,52,000. Commits on blur or Enter; Escape reverts. */
export default function Default() {
    const [amount, setAmount] = useState<number | null>(15200000);
    return (
        <div className="flex w-64 flex-col gap-2">
            <MoneyInput aria-label="Amount" value={amount} onChange={setAmount} currency="INR" locale="en-IN" />
            <p className="text-muted-foreground mt-0! text-xs">
                Value: {amount === null ? 'empty' : `${amount} paise (${formatMoney(amount, 'INR', 'en-IN')})`}
            </p>
        </div>
    );
}
