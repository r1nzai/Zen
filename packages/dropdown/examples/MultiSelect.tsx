import { Dropdown, type DropdownItem } from '@rinzai/zen';
import { useState } from 'react';

/** Type a new name and pick "Add …" to create a tag (`mutable`). */
export default function MultiSelect() {
    const [tags, setTags] = useState<DropdownItem[]>(
        ['Essential', 'Shared', 'Work', 'Treat', 'Annual'].map((text) => ({ text, key: text.toLowerCase() })),
    );
    const [selected, setSelected] = useState<DropdownItem[]>([tags[0], tags[1]]);
    return (
        <Dropdown
            multiple
            mutable
            items={tags}
            selected={selected}
            onChange={setSelected}
            onAdd={(tag) => {
                setTags((all) => [...all, tag]);
                setSelected((s) => [...s, tag]);
            }}
            placeholder="No tags"
            className="w-80"
        />
    );
}
