import { Stat, StatRow } from '@rinzai/zen';

export default function Stats() {
    return (
        <StatRow className="w-full max-w-3xl">
            <Stat label="Income" value="$8,450" hint="+4% on last month" />
            <Stat label="Spent" value="$5,120" tone="negative" />
            <Stat label="Net this month" value="$3,330" tone="positive" />
        </StatRow>
    );
}
