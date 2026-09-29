import { Select, SelectItem } from '@rinzai/zen';
import { useState } from 'react';

const CATEGORIES = ['Groceries', 'Rent', 'Transport', 'Dining out', 'Subscriptions', 'Health', 'Travel'];

/** Keyboard: arrows, Home/End, type a letter to jump, Enter to choose, Escape to close. */
export default function Default() {
    const [category, setCategory] = useState<string | null>('rent');
    return (
        <Select aria-label="Category" value={category} onChange={setCategory} className="w-56">
            {CATEGORIES.map((label) => (
                <SelectItem key={label} value={label.toLowerCase().replace(/\s+/g, '-')}>
                    {label}
                </SelectItem>
            ))}
        </Select>
    );
}
