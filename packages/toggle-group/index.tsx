import { useToolbarOrientation } from '@zen/toolbar';
import { cx } from '@zen/utils/cx';
import { FormValue } from '@zen/utils/form-value';
import { useMergedRefs } from '@zen/utils/refs';
import { moveFocus, useRovingTabIndex } from '@zen/utils/roving';
import { useControllable } from '@zen/utils/useControllable';
import { ComponentProps, createContext, ReactNode, useContext, useRef } from 'react';

interface ToggleGroupContextValue {
    isPressed: (value: string) => boolean;
    setPressed: (value: string, pressed: boolean) => void;
}

const ITEM = '.zen__toggle-group-item';

const ToggleGroupContext = createContext<ToggleGroupContextValue | null>(null);

/**
 * Buttons that stay pressed, in a row: any number of them (`multiple`, e.g.
 * filters), or at most one, which can be released again. For exactly one
 * always chosen, use Segmented. ←→ move between them, Home and End jump to
 * the ends; Space or Enter presses.
 */
export default function ToggleGroup(props: ToggleGroupProps) {
    const {
        multiple,
        value,
        defaultValue,
        onValueChange,
        name,
        className,
        onKeyDown,
        children,
        ref: refProp,
        ...rest
    } = props;
    const [pressed, setValue, reset] = useControllable<string | null | readonly string[]>(
        value,
        defaultValue ?? (multiple ? [] : null),
        onValueChange as ((value: string | null | readonly string[]) => void) | undefined,
    );
    const on = typeof pressed === 'string' ? [pressed] : (pressed ?? []);
    const context: ToggleGroupContextValue = {
        isPressed: (v) => on.includes(v),
        setPressed: (v, press) => {
            if (multiple) setValue(press ? [...on, v] : on.filter((p) => p !== v));
            else setValue(press ? v : null);
        },
    };
    const ref = useRef<HTMLDivElement>(null);
    const refs = useMergedRefs(ref, refProp);
    // In a Toolbar, its items are the Toolbar's to move through.
    const toolbar = useToolbarOrientation();
    const own = !toolbar;
    useRovingTabIndex(ref, ITEM, '[aria-pressed=true]', own);

    return (
        <ToggleGroupContext.Provider value={context}>
            <div
                role="group"
                data-zen-roving={own ? '' : undefined}
                {...rest}
                ref={refs}
                onKeyDown={(e) => {
                    onKeyDown?.(e);
                    if (own) moveFocus(e, ITEM);
                }}
                className={cx(
                    'zen__toggle-group relative inline-flex w-fit flex-wrap gap-1',
                    // Its own glass track, unless a Toolbar already is one.
                    own && 'glow-edge border-tint/10 bg-tint/[0.03] rounded-xl border p-1',
                    toolbar === 'vertical' && 'flex-col',
                    className,
                )}
            >
                {children}
            </div>
            <FormValue name={name} value={on} onReset={reset} />
        </ToggleGroupContext.Provider>
    );
}

/** One button of a ToggleGroup: text, an icon (give it an aria-label), or both. */
export function ToggleGroupItem({ value, className, onClick, ...rest }: ToggleGroupItemProps) {
    const group = useContext(ToggleGroupContext);
    if (!group) throw new Error('<ToggleGroupItem> must be inside <ToggleGroup>');
    const pressed = group.isPressed(value);
    return (
        <button
            type="button"
            aria-pressed={pressed}
            onClick={(e) => {
                onClick?.(e);
                if (!e.defaultPrevented) group.setPressed(value, !pressed);
            }}
            className={cx(
                'zen__toggle-group-item text-muted-foreground hover:text-foreground focus-ring inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 text-sm whitespace-nowrap transition-[color,background-color,box-shadow] duration-300 select-none',
                'aria-pressed:bg-primary/15 aria-pressed:text-foreground aria-pressed:shadow-[inset_0_0_0_1px_oklch(var(--primary)/0.4)]',
                'disabled:hover:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
                className,
            )}
            {...rest}
        />
    );
}

interface ToggleGroupBaseProps extends Omit<ComponentProps<'div'>, 'defaultValue'> {
    /** Form field name: each pressed item's value is submitted under it. */
    name?: string;
    /** The ToggleGroupItems. */
    children?: ReactNode;
}

export type ToggleGroupProps = ToggleGroupBaseProps &
    (
        | {
              /** At most one pressed (the default); pressing another releases it. */
              multiple?: false;
              /** The pressed item's value, or null for none, when you keep it. */
              value?: string | null;
              defaultValue?: string | null;
              onValueChange?: (value: string | null) => void;
          }
        | {
              /** Any number pressed. */
              multiple: true;
              value?: readonly string[];
              defaultValue?: readonly string[];
              onValueChange?: (value: readonly string[]) => void;
          }
    );

export interface ToggleGroupItemProps extends ComponentProps<'button'> {
    value: string;
}
