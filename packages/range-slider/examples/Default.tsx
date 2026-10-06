import { RangeSlider } from '@rinzai/zen';
import { useState } from 'react';

/** Entries between two amounts. */
export default function Default() {
    const [span, setSpan] = useState<[number, number]>([50, 500]);
    return (
        <div className="flex w-full max-w-sm flex-col gap-3">
            <div className="flex justify-between text-sm">
                <span className="font-medium">Amount</span>
                <span className="text-muted-foreground tabular-nums">
                    ${span[0]} – ${span[1]}
                </span>
            </div>
            <RangeSlider
                label="Amount"
                min={0}
                max={1000}
                step={10}
                value={span}
                onValueChange={setSpan}
                valueText={(v) => `$${v}`}
            />
        </div>
    );
}
