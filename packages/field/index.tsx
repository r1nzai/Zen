import { cx } from '@zen/utils/cx';
import { AlertIcon, CheckIcon, InfoIcon } from '@zen/utils/status-icons';
import { cloneElement, createContext, isValidElement, ReactElement, ReactNode, useContext, useId } from 'react';

/** What a Field tells the control inside it. */
export interface FieldControl {
    /** For the control's id (the label's `for`). */
    id: string;
    /** The label's id, for a control that isn't a native form element (aria-labelledby). */
    labelId: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
}

const FieldContext = createContext<FieldControl | null>(null);

/**
 * The ids and state of the Field around a control (null outside one). Field
 * also puts them on its direct child; this is for a control nested deeper,
 * such as a ComboboxTrigger inside a Combobox, or your own.
 */
export function useField() {
    return useContext(FieldContext);
}

/**
 * A labelled form control with an optional hint and error. Links them for
 * screen readers: the control gets an id (if it has none), aria-describedby
 * for the hint and error, and aria-invalid while there's an error. The direct
 * child gets these as props; a control nested deeper reads them with useField.
 */
export default function Field({ label, hint, error, children, className }: FieldProps) {
    const baseId = useId();
    const child = isValidElement(children) ? (children as ReactElement<Record<string, unknown>>) : null;
    const controlId = (child?.props.id as string | undefined) ?? `${baseId}-control`;
    const hintId = hint ? `${baseId}-hint` : undefined;
    const errorId = error ? `${baseId}-error` : undefined;
    const describedBy = cx(child?.props['aria-describedby'] as string | undefined, hintId, errorId).trim() || undefined;
    const labelId = `${baseId}-label`;
    const control: FieldControl = {
        id: controlId,
        labelId,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
    };

    return (
        <FieldContext.Provider value={control}>
            <div className={cx('zen__field flex flex-col gap-2', className)}>
                <label id={labelId} htmlFor={controlId} className="text-sm leading-none font-medium">
                    {label}
                </label>
                {child
                    ? cloneElement(child, {
                          id: controlId,
                          'aria-describedby': describedBy,
                          'aria-invalid': error ? true : child.props['aria-invalid'],
                      })
                    : children}
                {hint && (
                    <p id={hintId} className="text-muted-foreground mt-0! text-xs">
                        {hint}
                    </p>
                )}
                {error && (
                    <p
                        id={errorId}
                        role="alert"
                        className="text-destructive mt-0! flex items-center gap-1.5 text-xs font-medium"
                    >
                        <AlertIcon className="shrink-0" />
                        {error}
                    </p>
                )}
            </div>
        </FieldContext.Provider>
    );
}

/** A message for a form as a whole: an error in a tinted box, or a quiet note. */
export function FormMessage({ tone = 'info', children, className }: FormMessageProps) {
    const Icon = tone === 'error' ? AlertIcon : tone === 'success' ? CheckIcon : InfoIcon;
    return (
        <p
            role={tone === 'error' ? 'alert' : 'status'}
            className={cx(
                'mt-0! flex items-start gap-2 text-sm',
                tone === 'error' &&
                    'border-destructive/35 bg-destructive/10 text-destructive rounded-lg border px-3 py-2',
                tone === 'success' && 'border-primary/30 bg-primary/10 text-primary rounded-lg border px-3 py-2',
                tone === 'info' && 'text-muted-foreground',
                className,
            )}
        >
            <Icon className="mt-0.5 shrink-0" />
            <span>{children}</span>
        </p>
    );
}

export interface FieldProps {
    label: ReactNode;
    /** Help text under the control. */
    hint?: ReactNode;
    /** Error under the control; marks it invalid. */
    error?: ReactNode;
    /** One control (Input, Select, MoneyInput…), or anything else (then link it yourself). */
    children: ReactNode;
    className?: string;
}

export interface FormMessageProps {
    tone?: 'info' | 'success' | 'error';
    children: ReactNode;
    className?: string;
}
