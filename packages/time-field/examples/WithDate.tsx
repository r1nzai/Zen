import { DatePicker, Field, TimeField } from '@rinzai/zen';

/** A date and a time side by side: a DatePicker for the day, a TimeField for the time. */
export default function WithDate() {
    return (
        <div className="flex items-end gap-2">
            <Field label="Date" className="w-44">
                <DatePicker defaultValue="2026-10-06" />
            </Field>
            <Field label="Time">
                <TimeField defaultValue="18:45" step={15} locale="en-US" />
            </Field>
        </div>
    );
}
