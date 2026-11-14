import { RefObject, useEffect, useRef } from 'react';

/** Calls `onReset` when the form the element is in is reset. */
export function useFormReset(element: RefObject<HTMLInputElement | null>, onReset: (() => void) | undefined) {
    const reset = useRef(onReset);
    useEffect(() => {
        reset.current = onReset;
    });
    useEffect(() => {
        const form = element.current?.form;
        if (!form) return;
        const onFormReset = () => reset.current?.();
        form.addEventListener('reset', onFormReset);
        return () => form.removeEventListener('reset', onFormReset);
    });
}

/**
 * A custom control's part in a form: hidden inputs carrying its value under
 * `name` (one per item for a list, as a native multiple select submits), so
 * FormData and native submission see it, and `onReset` when the form is reset
 * (to go back to the control's first value).
 */
export function FormValue({
    name,
    value,
    onReset,
}: {
    name?: string;
    value: string | readonly string[];
    onReset?: () => void;
}) {
    // A nameless, disabled input: never submitted, but always there to find the form by.
    const anchor = useRef<HTMLInputElement>(null);
    useFormReset(anchor, onReset);
    if (!name) return null;
    return (
        <>
            <input ref={anchor} type="hidden" disabled />
            {(typeof value === 'string' ? [value] : value).map((v, i) => (
                <input key={i} type="hidden" name={name} value={v} />
            ))}
        </>
    );
}
