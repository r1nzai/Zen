import { AnimatedMoney, Button, Stat } from '@rinzai/zen';
import { useState } from 'react';

/** With `roll`, each digit rolls to its new one, like an odometer. */
export default function Roll() {
    const [total, setTotal] = useState(184250);
    return (
        <div className="flex w-full max-w-xs flex-col gap-4">
            <Stat
                label="Spent this month"
                value={<AnimatedMoney roll value={total} currency="USD" locale="en-US" showDecimals />}
            />
            <Button
                variant="outline"
                className="self-start"
                onClick={() => setTotal((t) => t + Math.round(Math.random() * 40000))}
            >
                Add a purchase
            </Button>
        </div>
    );
}
