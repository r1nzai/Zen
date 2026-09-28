import { AnimatedMoney, AnimatedNumber, Button, Stat, StatRow } from '@rinzai/zen';
import { useState } from 'react';

/** Numbers count to each new value (and up from zero when first shown). */
export default function Default() {
    const [net, setNet] = useState(625400);
    const [entries, setEntries] = useState(42);
    return (
        <div className="flex w-full max-w-lg flex-col gap-4">
            <StatRow className="sm:grid-cols-2!">
                <Stat
                    label="Net this month"
                    tone="positive"
                    value={<AnimatedMoney value={net} currency="USD" locale="en-US" />}
                />
                <Stat label="Entries" value={<AnimatedNumber value={entries} />} />
            </StatRow>
            <Button
                variant="outline"
                className="self-start"
                onClick={() => {
                    setNet((n) => n + Math.round((Math.random() - 0.4) * 300000));
                    setEntries((e) => e + 1);
                }}
            >
                Add an entry
            </Button>
        </div>
    );
}
