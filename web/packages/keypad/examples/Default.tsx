import { Button, Keypad } from '@rinzai/zen';
import { useState } from 'react';

/** Entering an amount on a phone: the figure above, the pad below. */
export default function Default() {
    const [typed, setTyped] = useState('');
    const amount = Number(typed || 0);
    return (
        <div className="flex w-full max-w-72 flex-col gap-4">
            <p className="mt-0! text-center text-4xl font-semibold tracking-tight tabular-nums" aria-live="polite">
                ${typed || '0'}
            </p>
            <Keypad value={typed} onValueChange={setTyped} />
            <Button disabled={amount <= 0} onClick={() => setTyped('')}>
                Add ${amount.toFixed(2)}
            </Button>
        </div>
    );
}
