import { formatMoney, Meter } from '@rinzai/zen';

const inr = (paise: number) => formatMoney(paise, 'INR', 'en-IN', { showDecimals: false });

/** Spend against a budget: the bar warms near the limit and turns red past it. */
export default function Budget() {
    const budgets = [
        { label: 'Groceries', spent: 620000, budget: 1000000 },
        { label: 'Dining out', spent: 270000, budget: 300000 },
        { label: 'Transport', spent: 410000, budget: 350000 },
    ];
    return (
        <div className="flex w-80 flex-col gap-5">
            {budgets.map(({ label, spent, budget }) => {
                const over = spent > budget;
                const status = over ? `${inr(spent - budget)} over` : `${inr(budget - spent)} left`;
                return (
                    <Meter
                        key={label}
                        label={label}
                        value={spent}
                        max={budget}
                        detail={`${inr(spent)} / ${inr(budget)}`}
                        hint={status}
                        valueText={`${inr(spent)} of ${inr(budget)}, ${status}`}
                    />
                );
            })}
        </div>
    );
}
