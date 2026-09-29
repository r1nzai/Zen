import { Segmented, SegmentedItem } from '@rinzai/zen';
import { useState } from 'react';

const icon = (d: string) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-3.5" aria-hidden>
        <path d={d} />
    </svg>
);

/** SegmentedItem holds anything (here an icon and text), and an option can be disabled. */
export default function WithIcons() {
    const [view, setView] = useState('list');
    return (
        <Segmented label="View" value={view} onChange={setView}>
            <SegmentedItem value="list">
                <span className="flex items-center gap-1.5">{icon('M3 4h10M3 8h10M3 12h10')} List</span>
            </SegmentedItem>
            <SegmentedItem value="grid">
                <span className="flex items-center gap-1.5">
                    {icon('M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z')} Grid
                </span>
            </SegmentedItem>
            <SegmentedItem value="chart" disabled>
                <span className="flex items-center gap-1.5">{icon('M3 13V8M8 13V3M13 13V6')} Chart</span>
            </SegmentedItem>
        </Segmented>
    );
}
