import { addMonths, MonthPicker } from '@rinzai/zen';
import { useState } from 'react';

/** A start and an optional end: the end can't come before the start, and can be cleared. */
export default function Range() {
    const [start, setStart] = useState<string | null>('2026-10');
    const [end, setEnd] = useState<string | null>('2027-09');
    return (
        <div className="flex items-end gap-3">
            <label className="flex flex-col gap-2 text-sm font-medium">
                Starts
                <MonthPicker value={start} onChange={setStart} locale="en-US" className="w-40" />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
                Ends
                <MonthPicker
                    value={end}
                    onChange={setEnd}
                    locale="en-US"
                    min={start ? addMonths(start, 1) : undefined}
                    placeholder="No end"
                    onClear={() => setEnd(null)}
                    clearLabel="No end"
                    className="w-40"
                />
            </label>
        </div>
    );
}
