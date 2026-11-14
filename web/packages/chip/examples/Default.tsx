import { Chip, Input } from '@rinzai/zen';
import { useState } from 'react';

const YEARS = [5, 10, 15, 20, 30];

/** Quick picks beside a field: the chip matching the field's value shows pressed. */
export default function Default() {
    const [years, setYears] = useState('20');
    return (
        <div className="flex flex-col gap-3">
            <Input
                aria-label="Tenure in years"
                value={years}
                onChange={(e) => setYears(e.target.value)}
                className="w-24"
            />
            <div role="group" aria-label="Common tenures" className="flex flex-wrap gap-1.5">
                {YEARS.map((y) => (
                    <Chip key={y} pressed={years === String(y)} onClick={() => setYears(String(y))}>
                        {y} yrs
                    </Chip>
                ))}
            </div>
        </div>
    );
}
