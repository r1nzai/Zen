import { Checkbox } from '@rinzai/zen';
import { useState } from 'react';

const ACCOUNTS = ['Salary account', 'Credit card', 'Savings'];

/** A "select all" that shows a dash while only some are checked. */
export default function SelectAll() {
    const [picked, setPicked] = useState<string[]>(['Credit card']);
    const all = picked.length === ACCOUNTS.length;
    return (
        <div className="flex flex-col gap-3">
            <Checkbox
                checked={all}
                indeterminate={picked.length > 0 && !all}
                onChange={() => setPicked(all ? [] : ACCOUNTS)}
                className="font-medium"
            >
                All accounts
            </Checkbox>
            <div className="flex flex-col gap-3 pl-7">
                {ACCOUNTS.map((a) => (
                    <Checkbox
                        key={a}
                        checked={picked.includes(a)}
                        onChange={(on) => setPicked((p) => (on ? [...p, a] : p.filter((x) => x !== a)))}
                    >
                        {a}
                    </Checkbox>
                ))}
            </div>
        </div>
    );
}
