import { addDays, Calendar, dayOfWeek, today } from '@rinzai/zen';
import { useState } from 'react';

/** Only the next 60 days, and no weekends: min, max and isDisabled. Weeks start on Monday here, whatever the locale. */
export default function Limits() {
    const start = today();
    const [date, setDate] = useState<string | null>(null);
    return (
        <Calendar
            value={date}
            onChange={setDate}
            locale="en-US"
            weekStartsOn={1}
            min={start}
            max={addDays(start, 60)}
            isDisabled={(d) => dayOfWeek(d) === 0 || dayOfWeek(d) === 6}
        />
    );
}
