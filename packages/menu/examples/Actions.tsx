import { buttonVariants, Menu, MenuContent, MenuItem, MenuTrigger, useToast } from '@rinzai/zen';
import Ellipsis from '@zen/icons/ellipsis';

/** The usual "⋯" menu of actions for one thing: an icon button as the trigger, and a destructive item last. */
export default function Actions() {
    const toast = useToast();
    return (
        <Menu>
            <MenuTrigger aria-label="Goal actions" className={buttonVariants({ variant: 'icon', size: 'icon' })}>
                <Ellipsis />
            </MenuTrigger>
            <MenuContent>
                <MenuItem onSelect={() => toast('Edit')}>Edit</MenuItem>
                <MenuItem onSelect={() => toast('Duplicated', { tone: 'success' })}>Duplicate</MenuItem>
                <MenuItem destructive onSelect={() => toast('Deleted', { tone: 'error' })}>
                    Delete
                </MenuItem>
            </MenuContent>
        </Menu>
    );
}
