import { Field, NumberField } from '@rinzai/zen';
import { useState } from 'react';

/** `formatOptions` shows it as a percentage, a unit or with set decimals, and reads it back typed that way. */
export default function Formats() {
    const [rate, setRate] = useState<number | null>(0.065);
    return (
        <div className="flex w-56 flex-col gap-4">
            <Field label="Interest rate">
                <NumberField
                    value={rate}
                    onValueChange={setRate}
                    step={0.0025}
                    min={0}
                    max={0.3}
                    formatOptions={{ style: 'percent', minimumFractionDigits: 2 }}
                />
            </Field>
            <Field label="Distance">
                <NumberField
                    defaultValue={12.5}
                    step={0.5}
                    min={0}
                    formatOptions={{ style: 'unit', unit: 'kilometer' }}
                />
            </Field>
        </div>
    );
}
