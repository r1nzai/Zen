import { buttonVariants, Menu, MenuContent, MenuItem, MenuTrigger, useToast } from '@rinzai/zen';
import Ellipsis from '@zen/icons/ellipsis';

/** The usual "⋯" menu of actions for one thing: an icon button as the trigger, and a destructive item last. */
export default function Actions() {
    const toast = useToast();
    return (
        <Menu>
            <MenuTrigger aria-label="Goal actions" className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
                <Ellipsis />
            </MenuTrigger>
            <MenuContent>
                <MenuItem onSelect={() => toast('Edit')}>Edit</MenuItem>
                <MenuItem onSelect={() => toast('Duplicated', { tone: 'positive' })}>Duplicate</MenuItem>
                <MenuItem tone="negative" onSelect={() => toast('Deleted', { tone: 'negative' })}>
                    Delete
                </MenuItem>
            </MenuContent>
        </Menu>
    );
}
