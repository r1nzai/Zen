import { Calendar, type DateRange, daysBetween, formatDateRange } from '@rinzai/zen';
import { useState } from 'react';

/** Two months side by side: pick a start, then an end. The days between are previewed as you point. */
export default function Range() {
    const [range, setRange] = useState<DateRange | null>({ start: '2026-10-05', end: '2026-10-12' });
    return (
        <div className="flex flex-col items-center gap-3">
            <Calendar mode="range" months={2} value={range} onChange={setRange} locale="en-GB" />
            <p className="text-muted-foreground mt-0! text-xs">
                {range?.end
                    ? `${formatDateRange(range.start, range.end, 'en-GB')} · ${daysBetween(range.start, range.end) + 1} days`
                    : 'Pick the last day'}
            </p>
        </div>
    );
}
