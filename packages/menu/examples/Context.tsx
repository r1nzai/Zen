import { Menu, MenuContent, MenuContextTrigger, MenuItem, MenuSeparator, useToast } from '@rinzai/zen';
import { useState } from 'react';

const ENTRIES = [
    { id: 1, label: 'Weekly shop', amount: '−$165' },
    { id: 2, label: 'Train pass', amount: '−$92' },
    { id: 3, label: 'Salary', amount: '+$4,200' },
];

/** Right-click an entry (or press and hold on a phone) for its actions. One menu serves the whole list. */
export default function Context() {
    const toast = useToast();
    const [entry, setEntry] = useState(ENTRIES[0]);
    return (
        <Menu>
            <ul className="glass glow-edge divide-tint/[0.06] w-full max-w-sm divide-y rounded-xl">
                {ENTRIES.map((e) => (
                    <MenuContextTrigger
                        key={e.id}
                        asChild
                        onContextMenu={() => setEntry(e)}
                        onPointerDown={() => setEntry(e)}
                    >
                        <li
                            tabIndex={0}
                            className="focus-visible:ring-ring/40 flex justify-between px-4 py-3 text-sm outline-hidden select-none focus-visible:ring-2"
                        >
                            <span>{e.label}</span>
                            <span className="tabular-nums">{e.amount}</span>
                        </li>
                    </MenuContextTrigger>
                ))}
            </ul>
            <MenuContent aria-label={`${entry.label} actions`}>
                <MenuItem onSelect={() => toast(`Editing ${entry.label}`)}>Edit</MenuItem>
                <MenuItem onSelect={() => toast(`Duplicated ${entry.label}`, { tone: 'success' })}>Duplicate</MenuItem>
                <MenuSeparator />
                <MenuItem destructive onSelect={() => toast(`Deleted ${entry.label}`, { tone: 'error' })}>
                    Delete
                </MenuItem>
            </MenuContent>
        </Menu>
    );
}
