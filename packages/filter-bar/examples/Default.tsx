import { Button, FilterBar, FilterChip } from '@rinzai/zen';
import { useState } from 'react';

const ALL = { amount: 'Amount: $50–$500', category: 'Category: Dining out', tag: 'Tag: Shared' };
type Key = keyof typeof ALL;

/** The filters on a list of entries; remove one, or all at once. */
export default function Default() {
    const [on, setOn] = useState<Key[]>(['amount', 'category', 'tag']);
    return (
        <div className="flex min-h-16 w-full max-w-md flex-col items-start gap-3">
            <FilterBar onClear={() => setOn([])}>
                {on.map((key) => (
                    <FilterChip
                        key={key}
                        onRemove={() => setOn((keys) => keys.filter((k) => k !== key))}
                        removeLabel={`Remove ${key} filter`}
                    >
                        {ALL[key]}
                    </FilterChip>
                ))}
            </FilterBar>
            {on.length === 0 && (
                <Button variant="outline" size="sm" onClick={() => setOn(['amount', 'category', 'tag'])}>
                    Filter again
                </Button>
            )}
        </div>
    );
}
