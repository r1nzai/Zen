import {
    buttonVariants,
    Menu,
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
import Settings from '@zen/icons/settings';
import { useState } from 'react';

/**
 * Settings that stay put while you change them: checkbox items turn columns on
 * and off, radio items pick the order, and a submenu holds the less used
 * exports. Hover, or use the arrow keys, to open it.
 */
export default function Options() {
    const toast = useToast();
    const [sort, setSort] = useState('date');
    return (
        <Menu>
            <MenuTrigger className={buttonVariants({ variant: 'outline' })}>
                <Settings className="size-4" />
                View
            </MenuTrigger>
            <MenuContent className="w-56">
                <MenuCheckboxItem defaultChecked>Category</MenuCheckboxItem>
                <MenuCheckboxItem defaultChecked>Account</MenuCheckboxItem>
                <MenuCheckboxItem>Notes</MenuCheckboxItem>
                <MenuSeparator />
                <MenuRadioGroup aria-label="Sort by" value={sort} onValueChange={setSort}>
                    <MenuRadioItem value="date">Newest first</MenuRadioItem>
                    <MenuRadioItem value="amount">Largest first</MenuRadioItem>
                </MenuRadioGroup>
                <MenuSeparator />
                <MenuSub>
                    <MenuSubTrigger>Export</MenuSubTrigger>
                    <MenuSubContent>
                        <MenuItem onSelect={() => toast('Exported as CSV')}>CSV</MenuItem>
                        <MenuItem onSelect={() => toast('Exported as PDF')}>PDF</MenuItem>
                        <MenuItem onSelect={() => toast('Exported as JSON')}>JSON</MenuItem>
                    </MenuSubContent>
                </MenuSub>
            </MenuContent>
        </Menu>
    );
}
