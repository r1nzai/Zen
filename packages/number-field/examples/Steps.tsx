import { Field, NumberField } from '@rinzai/zen';
import { useState } from 'react';

const clamp = (n: number) => Math.min(10, Math.max(0, n));

/**
 * A count kept somewhere else, such as a server another device also changes.
 * `onValueCommit` says how each change came about: − + and ↑↓ send their step
 * (`delta`), added to whatever the count is by then; a typed number is sent
 * once, on Enter or on leaving the field.
 */
export default function Steps() {
    const [count, setCount] = useState(3);
    const [sent, setSent] = useState<string | null>(null);
    return (
        <Field label="Episodes watched" hint={sent ? `Sent ${sent}` : 'Out of 10'} className="w-56">
            <NumberField
                value={count}
                min={0}
                max={10}
                size="sm"
                onValueCommit={(n, change) => {
                    if (change.reason === 'step') {
                        setCount((now) => clamp(now + change.delta));
                        setSent(change.delta > 0 ? `+${change.delta}` : `−${-change.delta}`);
                    } else {
                        setCount(n ?? 0);
                        setSent(String(n ?? 0));
                    }
                }}
            />
        </Field>
    );
}
