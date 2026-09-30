import { cx } from '@zen/utils/cx';
import { ReactNode, useState } from 'react';

/**
 * A value edited in place, e.g. in a table cell: shows `children` as a button,
 * and on click (or Enter) swaps in your editor. Call `close()` from the editor
 * when it's done (committed or cancelled). Works with any editor: a compact
 * MoneyInput, an Input, a Select.
 */
export default function EditableCell({
    children,
    editor,
    label,
    readOnly = false,
    editing: editingProp,
    onEditingChange,
    title,
    className,
}: EditableCellProps) {
    const [editingState, setEditingState] = useState(false);
    const editing = editingProp ?? editingState;
    const setEditing = (next: boolean) => {
        if (editingProp === undefined) setEditingState(next);
        onEditingChange?.(next);
    };

    if (readOnly) {
        return (
            <span title={title} className={cx('zen__editable-cell block px-1 text-right tabular-nums', className)}>
                {children}
            </span>
        );
    }
    if (editing) return <>{editor(() => setEditing(false))}</>;
    return (
        <button
            type="button"
            title={title}
            aria-label={label ? `${label}. Edit` : undefined}
            onClick={() => setEditing(true)}
            className={cx(
                'zen__editable-cell hover:bg-primary/10 focus-visible:ring-ring/50 w-full cursor-pointer rounded-md px-1.5 py-0.5 text-right tabular-nums transition-colors focus-visible:ring-2 focus-visible:outline-hidden',
                className,
            )}
        >
            {children}
        </button>
    );
}

export interface EditableCellProps {
    /** What the cell shows when not editing. */
    children: ReactNode;
    /** The editor to show while editing; call `close` when it's done. */
    editor: (close: () => void) => ReactNode;
    /** Accessible name of the value, e.g. "Rent, Oct 2026: ₹18,500"; " Edit" is added for the button. */
    label?: string;
    /** Show the value without making it editable. */
    readOnly?: boolean;
    /** Control the editing state yourself (with onEditingChange). */
    editing?: boolean;
    onEditingChange?: (editing: boolean) => void;
    title?: string;
    className?: string;
}
