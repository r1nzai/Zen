import { Chart, ChartArea, ChartReference } from '@rinzai/zen';

const MONTHS = [
    '2026-04',
    '2026-05',
    '2026-06',
    '2026-07',
    '2026-08',
    '2026-09',
    '2026-10',
    '2026-11',
    '2026-12',
    '2027-01',
    '2027-02',
    '2027-03',
];
const BALANCE = [4.2, 5.1, 3.8, 4.6, 6.2, 7.1, 6.4, 7.9, 8.8, 7.6, 9.4, 10.2].map((l) => l * 100000);
const TODAY = '2026-09';
// One series split in two at today: solid where it happened, dashed where it's projected.
const DATA = MONTHS.map((month, i) => ({
    month,
    balance: month <= TODAY ? BALANCE[i] : null,
    projected: month >= TODAY ? BALANCE[i] : null,
}));
const label = (m: string) => new Date(`${m}-01T00:00Z`).toLocaleString('en-IN', { month: 'short', timeZone: 'UTC' });
const money = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: 'compact',
    maximumFractionDigits: 1,
});

/** An area in the theme's glow: solid up to today, dashed ahead, with a "Today" marker. Point at it, or focus it and use the arrow keys. */
export default function Balance() {
    return (
        <Chart
            data={DATA}
            x="month"
            label="Balance over time"
            summary="Balance grows from ₹4.2L in April to a projected ₹10.2L next March."
            formatX={label}
            formatY={(v) => money.format(v)}
            className="w-full max-w-2xl"
        >
            <ChartArea dataKey="balance" label="Balance" color="oklch(var(--glow))" />
            <ChartArea dataKey="projected" label="Projected" color="oklch(var(--glow-2))" dashed />
            <ChartReference x={TODAY} label="Today" />
        </Chart>
    );
}
