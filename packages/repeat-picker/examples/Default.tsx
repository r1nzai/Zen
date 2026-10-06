import { type Repeat, RepeatPicker } from '@rinzai/zen';
import { useState } from 'react';

/** Rent: monthly on the 1st, from November. */
export default function Default() {
    const [repeat, setRepeat] = useState<Repeat>({ every: 1, unit: 'month', day: 1 });
    return <RepeatPicker value={repeat} onChange={setRepeat} locale="en-US" start="2026-11-01" className="max-w-sm" />;
}
