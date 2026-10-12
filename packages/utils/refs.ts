import { Ref, useMemo } from 'react';

/** One ref that hands the element to each of `refs`. */
export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]) {
    return (node: T | null) => {
        for (const ref of refs) {
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
        }
    };
}

/** mergeRefs, kept the same while the refs are: a component's own ref and the one it was given. */
export function useMergedRefs<T>(...refs: (Ref<T> | undefined)[]) {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useMemo(() => mergeRefs(...refs), refs);
}
