import { DonutChart } from '@rinzai/zen';

const SPENDING = [
    { key: 'home', label: 'Home', value: 28000 },
    { key: 'food', label: 'Food', value: 14500 },
    { key: 'travel', label: 'Travel', value: 9200 },
    { key: 'fun', label: 'Fun', value: 6100 },
    { key: 'other', label: 'Other', value: 3400 },
];
const total = SPENDING.reduce((s, x) => s + x.value, 0);
const inr = (v: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

/** Parts of a whole with the total in the middle, and a legend of your own beside it. */
export default function Donut() {
    return (
        <div className="flex flex-wrap items-center gap-8">
            <DonutChart items={SPENDING} label="Spending by category" formatValue={inr}>
                <div>
                    <div className="text-muted-foreground text-[0.68rem] tracking-[0.1em] uppercase">Spent</div>
                    <div className="text-lg font-semibold tracking-tight">{inr(total)}</div>
                </div>
            </DonutChart>
            <ul className="flex min-w-48 flex-col gap-2 text-sm">
                {SPENDING.map((s, i) => (
                    <li key={s.key} className="flex items-center gap-2.5">
                        <span className="size-2.5 rounded-[3px]" style={{ background: `var(--chart-${i + 1})` }} />
                        <span className="flex-1">{s.label}</span>
                        <span className="font-medium tabular-nums">{inr(s.value)}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
