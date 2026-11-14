import { type DateRange, DateRangePicker } from '@rinzai/zen';
import { useState } from 'react';

/** A trip: the start, then the end, across two months. Closes once both are picked. */
export default function Range() {
    const [trip, setTrip] = useState<DateRange | null>(null);
    return (
        <DateRangePicker
            aria-label="Trip dates"
            value={trip}
            onValueChange={setTrip}
            clearable
            months={2}
            locale="en-US"
            className="w-64"
        />
    );
}
