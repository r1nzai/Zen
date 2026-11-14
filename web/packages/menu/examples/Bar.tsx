import {
    Menu,
    Menubar,
    MenuCheckboxItem,
    MenuContent,
    MenuItem,
    MenuRadioGroup,
    MenuRadioItem,
    MenuSeparator,
    MenuSub,
    MenuSubContent,
    MenuSubTrigger,
    MenuTrigger,
    useToast,
} from '@rinzai/zen';
import { useState } from 'react';

/**
 * A row of menus, as at the top of an app. Tab to it once: ←→ move between
 * the menus and ↓ opens one; with one open, ←→ go to the next and pointing at
 * another label switches to it.
 */
export default function Bar() {
    const toast = useToast();
    const [period, setPeriod] = useState('month');
    return (
        <Menubar aria-label="Ledger">
            <Menu>
                <MenuTrigger>File</MenuTrigger>
                <MenuContent>
                    <MenuItem onSelect={() => toast('New entry')}>New entry</MenuItem>
                    <MenuItem onSelect={() => toast('Imported')}>Import…</MenuItem>
                    <MenuSub>
                        <MenuSubTrigger>Export</MenuSubTrigger>
                        <MenuSubContent>
                            <MenuItem onSelect={() => toast('Exported as CSV')}>CSV</MenuItem>
                            <MenuItem onSelect={() => toast('Exported as PDF')}>PDF</MenuItem>
                        </MenuSubContent>
                    </MenuSub>
                </MenuContent>
            </Menu>
            <Menu>
                <MenuTrigger>Edit</MenuTrigger>
                <MenuContent>
                    <MenuItem onSelect={() => toast('Undone')}>Undo</MenuItem>
                    <MenuItem onSelect={() => toast('Redone')}>Redo</MenuItem>
                    <MenuSeparator />
                    <MenuItem tone="negative" onSelect={() => toast('Deleted', { tone: 'negative' })}>
                        Delete entry
                    </MenuItem>
                </MenuContent>
            </Menu>
            <Menu>
                <MenuTrigger>View</MenuTrigger>
                <MenuContent className="w-52">
                    <MenuRadioGroup aria-label="Period" value={period} onValueChange={setPeriod}>
                        <MenuRadioItem value="week">Week</MenuRadioItem>
                        <MenuRadioItem value="month">Month</MenuRadioItem>
                        <MenuRadioItem value="year">Year</MenuRadioItem>
                    </MenuRadioGroup>
                    <MenuSeparator />
                    <MenuCheckboxItem defaultChecked>Show categories</MenuCheckboxItem>
                </MenuContent>
            </Menu>
        </Menubar>
    );
}
