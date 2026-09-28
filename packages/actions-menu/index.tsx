import { cx } from '@zen/utils/cx';
import { useGraphicsMode } from '@zen/utils/graphics';
import { useAnchoredPopup } from '@zen/utils/useAnchoredPopup';
import { KeyboardEvent } from 'react';

export interface Action {
    label: string;
    onClick: () => void;
    destructive?: boolean;
}

const ITEM =
    'flex w-full cursor-default items-center rounded-lg px-3 py-2 text-sm outline-hidden select-none hover:bg-tint/[0.07] focus:bg-tint/[0.07]';

/**
 * "⋯" button opening a short menu of actions for one thing. A native popover:
 * outside clicks and Escape close it, and focus returns to the button.
 */
export default function ActionsMenu({ label, actions, className }: ActionsMenuProps) {
    useGraphicsMode();
    const popup = useAnchoredPopup<HTMLDivElement>({
        align: 'end',
        offset: 6,
        // Focus the menu itself, so arrow keys work without highlighting an item for mouse users.
        onOpenChange: (open) => open && popup.popupRef.current?.focus(),
    });
    const menuRef = popup.popupRef;
    const items = actions.filter((a): a is Action => !!a);

    const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        const buttons = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []);
        const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const last = buttons.length - 1;
        // Nothing focused yet (just opened): Down starts at the top, Up at the bottom.
        const next = { ArrowDown: i + 1, ArrowUp: i === -1 ? last : i - 1, Home: 0, End: last }[e.key];
        if (next === undefined) return;
        e.preventDefault();
        buttons[(next + buttons.length) % buttons.length]?.focus();
    };

    return (
        <>
            <button
                type="button"
                aria-label={label}
                aria-haspopup="menu"
                {...popup.triggerProps}
                className={cx(
                    'text-muted-foreground grid size-9 shrink-0 place-items-center rounded-lg outline-hidden',
                    'hover:bg-tint/[0.06] hover:text-foreground focus-visible:ring-ring/50 focus-visible:ring-2',
                    'data-popup-open:bg-tint/[0.06]',
                    className,
                )}
            >
                <svg viewBox="0 0 16 16" fill="currentColor" className="size-4" aria-hidden>
                    <circle cx="3" cy="8" r="1.4" />
                    <circle cx="8" cy="8" r="1.4" />
                    <circle cx="13" cy="8" r="1.4" />
                </svg>
            </button>
            <div
                {...popup.popupProps}
                role="menu"
                aria-label={label}
                tabIndex={-1}
                onKeyDown={onKeyDown}
                className="zen__popover glass glass-blur text-foreground min-w-44 rounded-xl p-1.5 outline-hidden"
            >
                {items.map((a) => (
                    <button
                        key={a.label}
                        type="button"
                        role="menuitem"
                        tabIndex={-1}
                        className={cx(
                            ITEM,
                            a.destructive && 'text-destructive hover:bg-destructive/10 focus:bg-destructive/10',
                        )}
                        onClick={() => {
                            popup.setOpen(false);
                            a.onClick();
                        }}
                    >
                        {a.label}
                    </button>
                ))}
            </div>
        </>
    );
}

export interface ActionsMenuProps {
    /** Accessible name for the button and menu, e.g. "Goal actions". */
    label: string;
    /** Falsy entries are skipped, so actions can be added conditionally. */
    actions: (Action | false | null | undefined)[];
    className?: string;
}
