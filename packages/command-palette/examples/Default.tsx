import { Button, CommandPalette, useCommandPaletteShortcut, type CommandItem } from '@rinzai/zen';
import ChartBar from '@zen/icons/chart-bar';
import ListBullet from '@zen/icons/list-bullet';
import Settings from '@zen/icons/settings';
import { useState } from 'react';

/** Pages and actions in one search. Open it with the button, or ⌘K / Ctrl+K. */
export default function Default() {
    const [open, setOpen] = useState(false);
    const [last, setLast] = useState<string>();
    useCommandPaletteShortcut(() => setOpen(true));
    const go = (label: string) => () => setLast(label);
    const items: CommandItem[] = [
        { label: 'Overview', group: 'Pages', icon: <ChartBar />, onSelect: go('Overview') },
        { label: 'Entries', group: 'Pages', icon: <ListBullet />, keywords: ['transactions'], onSelect: go('Entries') },
        { label: 'Settings', group: 'Pages', icon: <Settings />, keywords: ['preferences'], onSelect: go('Settings') },
        { label: 'Add entry', group: 'Actions', hint: 'N', onSelect: go('Add entry') },
        { label: 'Import a statement', group: 'Actions', keywords: ['csv', 'bank'], onSelect: go('Import') },
        { label: 'Export to CSV', group: 'Actions', onSelect: go('Export') },
    ];
    return (
        <div className="flex flex-col items-center gap-3">
            <Button variant="outline" onClick={() => setOpen(true)}>
                Search… <kbd className="text-muted-foreground ml-2 font-sans text-xs">⌘K</kbd>
            </Button>
            {last && <p className="text-muted-foreground mt-0! text-sm">Ran: {last}</p>}
            <CommandPalette open={open} onOpenChange={setOpen} items={items} placeholder="Search pages and actions…" />
        </div>
    );
}
