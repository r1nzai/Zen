import { Radio, RadioGroup } from '@rinzai/zen';
import { useState } from 'react';

/** In a row, with one option disabled. */
export default function Horizontal() {
    const [every, setEvery] = useState<string | null>(null);
    return (
        <RadioGroup label="Repeat" value={every} onChange={setEvery} orientation="horizontal">
            <Radio value="week">Weekly</Radio>
            <Radio value="month">Monthly</Radio>
            <Radio value="year">Yearly</Radio>
            <Radio value="custom" disabled>
                Custom
            </Radio>
        </RadioGroup>
    );
}
