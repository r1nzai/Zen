import { Dropdown, type DropdownItem } from '@rinzai/zen';
import { useState } from 'react';

const MONTHS: DropdownItem[] = ['January', 'February', 'March', 'April', 'May', 'June'].map((text) => ({
    text,
    key: text.toLowerCase(),
}));

export default function SingleSelect() {
    const [month, setMonth] = useState(MONTHS[0]);
    return <Dropdown items={MONTHS} selected={month} onChange={setMonth} />;
}
