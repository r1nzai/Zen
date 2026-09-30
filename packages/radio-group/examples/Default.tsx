import { Radio, RadioGroup } from '@rinzai/zen';
import { useState } from 'react';

/** Arrow keys move between options and pick them, as for any radio group. */
export default function Default() {
    const [repay, setRepay] = useState<'emi' | 'tenure'>('emi');
    return (
        <RadioGroup label="After a prepayment" value={repay} onChange={setRepay}>
            <Radio value="emi" description="Keep the end date; pay less each month.">
                Lower the EMI
            </Radio>
            <Radio value="tenure" description="Keep the EMI; finish sooner and save more interest.">
                Shorten the tenure
            </Radio>
        </RadioGroup>
    );
}
