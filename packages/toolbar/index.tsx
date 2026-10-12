import Separator, { type SeparatorProps } from '@zen/separator';
import { cx } from '@zen/utils/cx';
import { useMergedRefs } from '@zen/utils/refs';
import { moveFocus, useRovingTabIndex } from '@zen/utils/roving';
import { ComponentProps, createContext, useContext, useRef } from 'react';

const ToolbarContext = createContext<'horizontal' | 'vertical' | null>(null);

/** Whether this is inside a Toolbar, which then moves focus through its items (a ToggleGroup's too). */
export const useInToolbar = () => useContext(ToolbarContext) !== null;

const CONTROLS = 'button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=combobox]';
// Arrow keys in a text field move its caret, not out of it.
const TYPING = 'input:not([type=checkbox], [type=radio], [type=range], [type=button]), textarea, [contenteditable]';

/**
 * A row of controls for one thing, e.g. a table's or an editor's: buttons,
 * ToggleGroups, Selects, a search field. Tab enters it once; ←→ (↑↓ when
 * `orientation="vertical"`) move between its controls, Home and End jump to
 * the ends. Divide it with ToolbarSeparator. Give it an aria-label.
 */
export default function Toolbar({
    orientation = 'horizontal',
    className,
    onKeyDown,
    ref: refProp,
    ...rest
}: ToolbarProps) {
    const ref = useRef<HTMLDivElement>(null);
    const refs = useMergedRefs(ref, refProp);
    useRovingTabIndex(ref, CONTROLS);
    return (
        <ToolbarContext.Provider value={orientation}>
            <div
                role="toolbar"
                aria-orientation={orientation === 'vertical' ? 'vertical' : undefined}
                data-zen-roving=""
                ref={refs}
                onKeyDown={(e) => {
                    onKeyDown?.(e);
                    const vertical = orientation === 'vertical';
                    if (
                        !vertical &&
                        (e.target as Element).matches(TYPING) &&
                        /^Arrow(Left|Right)$|^Home$|^End$/.test(e.key)
                    )
                        return;
                    moveFocus(e, CONTROLS, orientation);
                }}
                className={cx(
                    'zen__toolbar glow-edge border-tint/10 bg-tint/[0.03] relative flex w-fit items-center gap-1 rounded-xl border p-1',
                    orientation === 'vertical' && 'flex-col',
                    className,
                )}
                {...rest}
            />
        </ToolbarContext.Provider>
    );
}

/** A hairline between groups of a Toolbar's controls, across its direction. */
export function ToolbarSeparator({ className, ...rest }: Omit<SeparatorProps, 'orientation'>) {
    const across = useContext(ToolbarContext) === 'vertical';
    return (
        <Separator
            orientation={across ? 'horizontal' : 'vertical'}
            className={cx(across ? 'my-0.5 w-auto self-stretch mx-1.5' : 'mx-0.5 my-1.5', className)}
            {...rest}
        />
    );
}

export interface ToolbarProps extends ComponentProps<'div'> {
    orientation?: 'horizontal' | 'vertical';
}
