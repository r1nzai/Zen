import { Toggle } from '@rinzai/zen';
import { useState } from 'react';

export default function Default() {
    const [on, setOn] = useState(true);
    return (
        <label className="flex w-64 items-center justify-between">
            Repeats every month
            <Toggle checked={on} onChange={setOn} />
        </label>
    );
}
