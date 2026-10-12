import { useState } from 'react';

/**
 * A value that's controlled when `value` is given (null included: a controlled
 * empty value) and kept here, starting at `defaultValue`, when it's undefined.
 * Either way `set` reports the change. `U` is what can be set, when that's
 * narrower than what's held (a choice that starts as null but is never cleared).
 * `reset` goes back to `defaultValue` (on a form's reset); a controlled value is yours to reset.
 */
export function useControllable<T, U extends T = T>(
    value: T | undefined,
    defaultValue: T,
    onChange: ((value: U) => void) | undefined,
): [T, (next: U) => void, () => void] {
    const [own, setOwn] = useState<T>(defaultValue);
    const controlled = value !== undefined;
    const set = (next: U) => {
        if (!controlled) setOwn(next);
        onChange?.(next);
    };
    return [controlled ? value : own, set, () => setOwn(defaultValue)];
}
