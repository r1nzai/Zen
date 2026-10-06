import { commonRanges, type DateRange, DateRangePicker, today } from '@rinzai/zen';
import { useState } from 'react';

/** The ranges people pick most, one tap each, beside the calendar. */
export default function Presets() {
    const r = commonRanges(today());
    const [range, setRange] = useState<DateRange | null>(r.thisMonth);
    return (
        <DateRangePicker
            aria-label="Entries between"
            value={range}
            onChange={setRange}
            locale="en-US"
            className="w-64"
            presets={[
                { label: 'This week', range: r.thisWeek },
                { label: 'Last 7 days', range: r.last7Days },
                { label: 'Last 30 days', range: r.last30Days },
                { label: 'This month', range: r.thisMonth },
                { label: 'Last month', range: r.lastMonth },
                { label: 'This year', range: r.thisYear },
            ]}
        />
    );
}
