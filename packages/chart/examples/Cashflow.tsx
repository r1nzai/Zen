import { Chart, ChartBar, ChartLine, ChartReference } from '@rinzai/zen';

const DATA = [
    { month: 'Apr', income: 92000, spending: 61000 },
    { month: 'May', income: 92000, spending: 74000 },
    { month: 'Jun', income: 98000, spending: 58000 },
    { month: 'Jul', income: 98000, spending: 103000 },
    { month: 'Aug', income: 98000, spending: 66000 },
    { month: 'Sep', income: 112000, spending: 71000 },
    { month: 'Oct', income: 112000, spending: 69000 },
    { month: 'Nov', income: 112000, spending: 80000 },
].map((r) => ({ ...r, net: r.income - r.spending }));
const inr = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: 'compact',
    maximumFractionDigits: 1,
});

/** Bars grouped by month with a line on the same axis; months still to come are faded. */
export default function Cashflow() {
    return (
        <Chart
            data={DATA}
            x="month"
            label="Income and spending by month"
            formatY={(v) => inr.format(v)}
            className="w-full max-w-2xl"
        >
            <ChartBar dataKey="income" label="Income" dim={(_, i) => i > 5} />
            <ChartBar dataKey="spending" label="Spending" dim={(_, i) => i > 5} />
            <ChartLine dataKey="net" label="Net" color="var(--chart-3)" />
            <ChartReference y={0} tone="destructive" />
        </Chart>
    );
}
