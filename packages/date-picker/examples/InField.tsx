import { addDays, DatePicker, Field, today } from '@rinzai/zen';
import { useState } from 'react';

/** In a Field: the label, hint and error are wired to the picker. Only dates from today on. */
export default function InField() {
    const [date, setDate] = useState<string | null>(null);
    const [touched, setTouched] = useState(false);
    return (
        <Field
            label="Start date"
            hint="When the plan begins."
            error={touched && !date ? 'Pick a start date.' : undefined}
            className="w-64"
        >
            <DatePicker
                value={date}
                onChange={setDate}
                onBlur={() => setTouched(true)}
                locale="en-US"
                min={today()}
                max={addDays(today(), 365)}
            />
        </Field>
    );
}
