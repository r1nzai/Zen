import { ChartBarIcon, ListBullet, Segmented, SegmentedItem, Squares } from '@rinzai/zen';
import { useState } from 'react';

/** SegmentedItem holds anything (here an icon and text), and an option can be disabled. */
export default function WithIcons() {
    const [view, setView] = useState('list');
    return (
        <Segmented label="View" value={view} onChange={setView}>
            <SegmentedItem value="list">
                <span className="flex items-center gap-1.5">
                    <ListBullet className="size-4" /> List
                </span>
            </SegmentedItem>
            <SegmentedItem value="grid">
                <span className="flex items-center gap-1.5">
                    <Squares className="size-4" /> Grid
                </span>
            </SegmentedItem>
            <SegmentedItem value="chart" disabled>
                <span className="flex items-center gap-1.5">
                    <ChartBarIcon className="size-4" /> Chart
                </span>
            </SegmentedItem>
        </Segmented>
    );
}
