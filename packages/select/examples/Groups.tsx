import { Select, SelectGroup, SelectItem, SelectSeparator } from '@rinzai/zen';
import { useState } from 'react';

/** SelectItem children, organised with SelectGroup and SelectSeparator; the keyboard skips the disabled one. */
export default function Groups() {
    const [category, setCategory] = useState<string | null>('groceries');
    return (
        <Select aria-label="Category" value={category} onChange={setCategory} className="w-64">
            <SelectGroup label="Essentials">
                <SelectItem value="rent">Rent</SelectItem>
                <SelectItem value="groceries">Groceries</SelectItem>
                <SelectItem value="transport">Transport</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup label="Lifestyle">
                <SelectItem value="dining">Dining out</SelectItem>
                <SelectItem value="travel" disabled>
                    Travel (over budget)
                </SelectItem>
            </SelectGroup>
        </Select>
    );
}
