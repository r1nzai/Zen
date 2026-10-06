import { Button, ProgressRing } from '@rinzai/zen';
import { useState } from 'react';

/** Reaching the goal sends out a ring of glow. */
export default function Goal() {
    const [saved, setSaved] = useState(120);
    const goal = 200;
    return (
        <div className="flex items-center gap-6">
            <ProgressRing value={saved / goal} label="Holiday fund">
                <span className="text-sm font-semibold tabular-nums">${saved}</span>
            </ProgressRing>
            <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={() => setSaved((s) => Math.min(s + 40, goal))}>
                    Save $40
                </Button>
                <Button variant="ghost" onClick={() => setSaved(120)}>
                    Reset
                </Button>
            </div>
        </div>
    );
}
