import { Segmented, SegmentedItem } from '@rinzai/zen';
import { useState } from 'react';

export default function Default() {
    const [glow, setGlow] = useState<'off' | 'soft' | 'bright'>('soft');
    return (
        <Segmented label="Glow" value={glow} onChange={setGlow}>
            <SegmentedItem value="off">Off</SegmentedItem>
            <SegmentedItem value="soft">Soft</SegmentedItem>
            <SegmentedItem value="bright">Bright</SegmentedItem>
        </Segmented>
    );
}
