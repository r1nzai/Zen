import { Button, InputGroup, InputGroupAddon, InputGroupInput } from '@rinzai/zen';
import { useState } from 'react';

/** Controls in addons keep their own clicks; the text around them focuses the input. */
export default function WithButton() {
    const [query, setQuery] = useState('rent');
    return (
        <InputGroup className="w-80 pr-1">
            <InputGroupAddon>Filter</InputGroupAddon>
            <InputGroupInput value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Filter" />
            {query && (
                <InputGroupAddon>
                    <Button variant="ghost" size="sm" className="h-7" onClick={() => setQuery('')}>
                        Clear
                    </Button>
                </InputGroupAddon>
            )}
        </InputGroup>
    );
}
