import { Sparkline, Stat, StatRow } from '@rinzai/zen';

/** Beside the figures they explain: a balance over the month, and spending by week. */
export default function Default() {
    return (
        <StatRow className="w-full max-w-lg">
            <Stat
                label="Balance"
                value={
                    <span className="flex items-center justify-between gap-3">
                        $6,908
                        <Sparkline values={[4100, 4300, 3900, 5200, 5600, 5400, 6100, 6908]} />
                    </span>
                }
            />
            <Stat
                label="Spent"
                tone="negative"
                value={
                    <span className="flex items-center justify-between gap-3">
                        $2,742
                        <Sparkline tone="negative" values={[620, 540, 810, 772]} />
                    </span>
                }
            />
        </StatRow>
    );
}
