import { MonthPicker } from '@rinzai/zen';
import { useState } from 'react';

export default function Default() {
    const [month, setMonth] = useState<string | null>('2026-09');
    return <MonthPicker aria-label="Month" value={month} onChange={setMonth} locale="en-IN" className="w-48" />;
}
