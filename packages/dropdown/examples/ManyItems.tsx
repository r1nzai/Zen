import { Dropdown, type DropdownItem } from '@rinzai/zen';
import { useState } from 'react';

const ITEMS: DropdownItem[] = Array.from({ length: 2000 }, (_, i) => ({
    text: `Account ${String(i + 1).padStart(4, '0')}`,
    key: String(i + 1),
}));

/** 2,000 options: the list renders only the rows in view, so it opens and scrolls instantly. Type to filter. */
export default function ManyItems() {
    const [account, setAccount] = useState(ITEMS[0]);
    return <Dropdown items={ITEMS} selected={account} onChange={setAccount} className="w-64" />;
}
