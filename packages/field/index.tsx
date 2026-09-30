import Alert from '@zen/alert';
import { cx } from '@zen/utils/cx';
import { AlertIcon } from '@zen/utils/status-icons';
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

/** Space-separated ids, each once. */
const joinIds = (...lists: (string | undefined)[]) =>
    [...new Set(lists.flatMap((l) => l?.split(/\s+/) ?? []).filter(Boolean))].join(' ') || undefined;

/**
 * For Zen's own controls: the Field's hint, error and invalid state, when the
 * control is the one its label points at (its `id` is the Field's). Merged with
 * the control's own props, so a direct child (which Field already passes them
 * to) and a control nested in other markup end up the same.
 */
export function useFieldProps(props: { id?: string; 'aria-describedby'?: string; 'aria-invalid'?: unknown }) {
    const field = useField();
    if (!field || props.id !== field.id) return {};
    return {
        'aria-describedby': joinIds(props['aria-describedby'], field['aria-describedby']),
        'aria-invalid': (props['aria-invalid'] as boolean | undefined) ?? field['aria-invalid'],
    };
}

/**
 * A labelled form control with an optional hint and error. Links them for
 * screen readers: the control gets an id (if it has none), aria-describedby
 * for the hint or error, and aria-invalid while there's an error. The error
 * shows in place of the hint until it's fixed.
 *
 * The direct child gets these as props. When the control sits inside other
 * markup (e.g. an amount beside a unit select), give it an id and pass the
 * same id as `htmlFor`: Zen's controls with that id pick them up themselves.
 */
export default function Field({ label, hint, error, htmlFor, children, className }: FieldProps) {
    const baseId = useId();
    // Linked through htmlFor: the child is a wrapper, not the control.
    const child = !htmlFor && isValidElement(children) ? (children as ReactElement<Record<string, unknown>>) : null;
    const controlId = htmlFor ?? (child?.props.id as string | undefined) ?? `${baseId}-control`;
    const hintId = hint && !error ? `${baseId}-hint` : undefined;
    const errorId = error ? `${baseId}-error` : undefined;
    const labelId = `${baseId}-label`;
    const control: FieldControl = {
        id: controlId,
        labelId,
        'aria-describedby': joinIds(hintId, errorId),
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
                          'aria-describedby': joinIds(
                              child.props['aria-describedby'] as string | undefined,
                              control['aria-describedby'],
                          ),
                          'aria-invalid': error ? true : child.props['aria-invalid'],
                      })
                    : children}
                {hintId && (
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

/** A message for a form as a whole: an error or success in a tinted box, or a quiet note. An Alert, set for forms. */
export function FormMessage({ tone = 'info', children, className }: FormMessageProps) {
    return (
        <Alert
            tone={tone === 'error' ? 'negative' : tone === 'success' ? 'positive' : 'default'}
            plain={tone === 'info'}
            className={cx('mt-0!', className)}
        >
            {children}
        </Alert>
    );
}

export interface FieldProps {
    label: ReactNode;
    /** Help text under the control. */
    hint?: ReactNode;
    /** Error under the control, in place of the hint; marks it invalid. */
    error?: ReactNode;
    /** The control's id, when it isn't the direct child (it's inside other markup). */
    htmlFor?: string;
    /** One control (Input, Select, MoneyInput…), or anything else (then link it yourself). */
    children: ReactNode;
    className?: string;
}

export interface FormMessageProps {
    tone?: 'info' | 'success' | 'error';
    children: ReactNode;
    className?: string;
}
