import { DatePicker } from '@rinzai/zen';
import { useState } from 'react';

/** Opens on the chosen date, ready for the keyboard; picking a day closes it. With onClear, it can be emptied. */
export default function Default() {
    const [date, setDate] = useState<string | null>('2026-09-30');
    return (
        <DatePicker
            aria-label="Due date"
            value={date}
            onChange={setDate}
            onClear={() => setDate(null)}
            locale="en-IN"
            className="w-56"
        />
    );
}
