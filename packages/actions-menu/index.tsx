import Menu, { MenuItem } from '@zen/menu';
import { cx } from '@zen/utils/cx';

export interface Action {
    label: string;
    onClick: () => void;
    destructive?: boolean;
}

/**
 * "⋯" button opening a short menu of actions for one thing. A native popover:
 * outside clicks and Escape close it, and focus returns to the button. For
 * anything richer (icons, a header, groups, your own trigger), use Menu.
 */
export default function ActionsMenu({ label, actions, className }: ActionsMenuProps) {
    const items = actions.filter((a): a is Action => !!a);
    return (
        <Menu
            label={label}
            triggerClassName={cx(
                'text-muted-foreground grid size-9 shrink-0 place-items-center rounded-lg outline-hidden',
                'hover:bg-tint/[0.06] hover:text-foreground focus-visible:ring-ring/50 focus-visible:ring-2',
                'data-popup-open:bg-tint/[0.06]',
                className,
            )}
            trigger={
                <svg viewBox="0 0 16 16" fill="currentColor" className="size-4" aria-hidden>
                    <circle cx="3" cy="8" r="1.4" />
                    <circle cx="8" cy="8" r="1.4" />
                    <circle cx="13" cy="8" r="1.4" />
                </svg>
            }
        >
            {items.map((a) => (
                <MenuItem key={a.label} destructive={a.destructive} onSelect={a.onClick}>
                    {a.label}
                </MenuItem>
            ))}
        </Menu>
    );
}

export interface ActionsMenuProps {
    /** Accessible name for the button and menu, e.g. "Goal actions". */
    label: string;
    /** Falsy entries are skipped, so actions can be added conditionally. */
    actions: (Action | false | null | undefined)[];
    className?: string;
}
