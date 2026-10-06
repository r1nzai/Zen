import { Stat, StatRow, Trend } from '@rinzai/zen';

/** Spending going up is bad news (`good="down"`); savings going up is good. */
export default function Default() {
    return (
        <StatRow className="w-full max-w-xl">
            <Stat
                label="Spent"
                value="$1,845"
                hint={
                    <Trend value={0.12} good="down">
                        vs last month
                    </Trend>
                }
            />
            <Stat label="Saved" value="$640" hint={<Trend value={0.084}>vs last month</Trend>} />
            <Stat label="Bills" value="$1,210" hint={<Trend value={0}>vs last month</Trend>} />
        </StatRow>
    );
}
