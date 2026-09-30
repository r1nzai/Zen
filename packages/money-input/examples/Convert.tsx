import { type ForeignAmount, formatMoney, MoneyInput, type RateTable } from '@rinzai/zen';
import { useState } from 'react';

// Your app fetches these (e.g. the ECB's daily rates, from your server); here, a fixed sample.
const SAMPLE: RateTable = {
    base: 'EUR',
    date: '2026-09-29',
    rates: { INR: 98.4, USD: 1.17, GBP: 0.87, AED: 4.3, SGD: 1.5, JPY: 172.6 },
};
const loadRates = () => new Promise<RateTable>((done) => setTimeout(() => done(SAMPLE), 600));

/** Pick another currency from the symbol and type in it: it's converted into rupees at the loaded rate, and the original is kept. */
export default function Convert() {
    const [amount, setAmount] = useState<number | null>(3274000);
    const [original, setOriginal] = useState<ForeignAmount | null>(null);
    return (
        <div className="flex w-72 flex-col gap-2">
            <MoneyInput
                aria-label="Amount"
                value={amount}
                onChange={setAmount}
                currency="INR"
                locale="en-IN"
                convert={{
                    currencies: ['USD', 'EUR', 'GBP', 'AED', 'SGD', 'JPY'],
                    loadRates,
                    source: 'ECB',
                    onForeign: setOriginal,
                }}
            />
            <p className="text-muted-foreground mt-0! text-xs">
                Saved: {amount === null ? 'empty' : formatMoney(amount, 'INR', 'en-IN')}
                {original && `, typed as ${formatMoney(original.amount, original.currency, 'en-IN')}`}
            </p>
        </div>
    );
}
