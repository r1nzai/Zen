import { buttonVariants, Ellipsis, Menu, MenuItem, useToast } from '@rinzai/zen';

/** The usual "⋯" menu of actions for one thing: an icon button as the trigger, and a destructive item last. */
export default function Actions() {
    const toast = useToast();
    return (
        <Menu
            label="Goal actions"
            triggerClassName={buttonVariants({ variant: 'icon', size: 'icon' })}
            trigger={<Ellipsis />}
        >
            <MenuItem onSelect={() => toast('Edit')}>Edit</MenuItem>
            <MenuItem onSelect={() => toast('Duplicated', { tone: 'success' })}>Duplicate</MenuItem>
            <MenuItem destructive onSelect={() => toast('Deleted', { tone: 'error' })}>
                Delete
            </MenuItem>
        </Menu>
    );
}
