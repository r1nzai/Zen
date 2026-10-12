import { ToggleGroup, ToggleGroupItem } from '@rinzai/zen';
import { useState } from 'react';

/** Filters: any number on at once. */
export default function Default() {
    const [kinds, setKinds] = useState<readonly string[]>(['expense', 'income']);
    return (
        <div className="flex flex-col items-center gap-3">
            <ToggleGroup multiple aria-label="Show" value={kinds} onValueChange={setKinds}>
                <ToggleGroupItem value="expense">Expenses</ToggleGroupItem>
                <ToggleGroupItem value="income">Income</ToggleGroupItem>
                <ToggleGroupItem value="transfer">Transfers</ToggleGroupItem>
            </ToggleGroup>
            <p className="text-muted-foreground mt-0! text-sm">
                {kinds.length ? `Showing ${kinds.length} of 3 kinds` : 'Showing everything'}
            </p>
        </div>
    );
}
