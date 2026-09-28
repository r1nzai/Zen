import { Slider } from '@rinzai/zen';
import { useState } from 'react';

/** Filled up to the value; arrow keys and Home/End work as on any range input. */
export default function Default() {
    const [savings, setSavings] = useState(30);
    return (
        <div className="flex w-72 flex-col gap-2">
            <div className="flex justify-between text-sm">
                <span className="font-medium">Save each month</span>
                <span className="text-muted-foreground tabular-nums">{savings}%</span>
            </div>
            <Slider
                aria-label="Save each month"
                value={savings}
                onValueChange={setSavings}
                valueText={(v) => `${v} percent`}
            />
        </div>
    );
}
