import { Field, IconPicker, Input } from '@rinzai/zen';
import { useState } from 'react';

const ICONS = [
    { value: 'groceries', label: 'Groceries', icon: '🛒' },
    { value: 'dining', label: 'Dining', icon: '🍽️' },
    { value: 'transport', label: 'Transport', icon: '🚆' },
    { value: 'home', label: 'Home', icon: '🏠' },
    { value: 'bills', label: 'Bills', icon: '💡' },
    { value: 'gifts', label: 'Gifts', icon: '🎁' },
    { value: 'health', label: 'Health', icon: '💊' },
    { value: 'fun', label: 'Fun', icon: '🎬' },
    { value: 'travel', label: 'Travel', icon: '✈️' },
    { value: 'books', label: 'Books', icon: '📚' },
    { value: 'pets', label: 'Pets', icon: '🐾' },
    { value: 'work', label: 'Work', icon: '💼' },
];

/** A new category: its icon and colour beside its name. */
export default function Default() {
    const [look, setLook] = useState<{ icon: string; color?: string }>({ icon: 'groceries', color: 'teal' });
    return (
        <div className="flex w-full max-w-sm items-end gap-3">
            <IconPicker label="Category icon" icons={ICONS} value={look} onChange={setLook} />
            <Field label="Name" className="flex-1">
                <Input defaultValue="Groceries" />
            </Field>
        </div>
    );
}
