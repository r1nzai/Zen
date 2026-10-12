import { Field, TimeField } from '@rinzai/zen';
import { useState } from 'react';

/** Type the digits, or ↑↓ each part; minutes step by 5 here. */
export default function Default() {
    const [time, setTime] = useState<string | null>('09:30');
    return (
        <div className="flex flex-col items-start gap-2">
            <Field label="Reminder at">
                <TimeField value={time} onValueChange={setTime} step={5} />
            </Field>
            <p className="text-muted-foreground mt-0! text-sm tabular-nums">Value: {time ?? 'null'}</p>
        </div>
    );
}
