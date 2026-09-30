import { Calendar, formatDate } from '@rinzai/zen';
import { useState } from 'react';

/** Click a day, or use the keyboard: arrows, Home/End, Page Up/Down (Shift for years). The title jumps to any month and year. */
export default function Default() {
    const [date, setDate] = useState<string | null>('2026-09-30');
    return (
        <div className="flex flex-col items-center gap-3">
            <Calendar value={date} onChange={setDate} locale="en-US" />
            <p className="text-muted-foreground mt-0! text-xs">
                {date ? formatDate(date, 'en-US', 'full') : 'No date'}
            </p>
        </div>
    );
}
