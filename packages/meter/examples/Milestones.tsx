import { Button, formatMoney, Meter } from '@rinzai/zen';
import { useState } from 'react';

const money = (cents: number) => formatMoney(cents, 'USD', 'en-US', { showDecimals: false });

/** A savings goal with milestones at each quarter: the ones passed are notched into the fill. */
export default function Milestones() {
    const [saved, setSaved] = useState(420000);
    const goal = 1000000;
    return (
        <div className="flex w-full max-w-sm flex-col gap-4">
            <Meter
                label="Emergency fund"
                value={saved}
                max={goal}
                marks={[goal / 4, goal / 2, (goal * 3) / 4]}
                tone="default"
                detail={`${money(saved)} / ${money(goal)}`}
                hint={`${Math.floor((saved / goal) * 4)} of 4 milestones`}
                valueText={`${money(saved)} of ${money(goal)}`}
            />
            <Button
                variant="outline"
                className="self-start"
                onClick={() => setSaved((s) => Math.min(goal, s + 100000))}
            >
                Add $1,000
            </Button>
        </div>
    );
}
