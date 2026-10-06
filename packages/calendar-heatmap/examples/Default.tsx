import { CalendarHeatmap, type DateString, formatDate, formatMoney } from '@rinzai/zen';
import { useState } from 'react';

const SPENT: Partial<Record<DateString, number>> = {
    '2026-09-01': 185000,
    '2026-09-03': 3840,
    '2026-09-05': 2500,
    '2026-09-06': 7800,
    '2026-09-08': 1460,
    '2026-09-12': 16450,
    '2026-09-13': 9150,
    '2026-09-15': 4200,
    '2026-09-19': 3180,
    '2026-09-20': 41200,
    '2026-09-22': 1199,
    '2026-09-26': 6420,
    '2026-09-27': 2210,
};
const money = (cents: number) => formatMoney(cents, 'USD', 'en-US', { showDecimals: false });

/** What was spent each day of a month: pick a day to see it. */
export default function Default() {
    const [day, setDay] = useState<DateString | null>('2026-09-12');
    return (
        <div className="flex w-full max-w-xs flex-col gap-3">
            <CalendarHeatmap
                month="2026-09"
                values={SPENT}
                locale="en-US"
                format={money}
                onSelect={setDay}
                selected={day}
            />
            <p className="text-muted-foreground mt-0! text-sm">
                {day ? `${formatDate(day, 'en-US', 'long')}: ${money(SPENT[day] ?? 0)} spent` : 'Pick a day'}
            </p>
        </div>
    );
}
