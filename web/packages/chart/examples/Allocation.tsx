import { AllocationBar, formatMoney } from '@rinzai/zen';

/** Where September's income went. */
export default function Allocation() {
    return (
        <AllocationBar
            label="Income in September"
            className="w-full max-w-md"
            locale="en-US"
            formatValue={(v) => formatMoney(v, 'USD', 'en-US', { showDecimals: false })}
            items={[
                { key: 'bills', label: 'Bills', value: 182000 },
                { key: 'spending', label: 'Spending', value: 145600 },
                { key: 'savings', label: 'Savings', value: 96000 },
                { key: 'investing', label: 'Investing', value: 50000 },
                { key: 'left', label: 'Left over', value: 26400 },
            ]}
        />
    );
}
