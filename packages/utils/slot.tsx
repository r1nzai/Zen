import { cloneElement, ComponentProps, isValidElement, ReactElement, ReactNode, Ref } from 'react';

import { cx } from './cx';

type Props = Record<string, unknown>;

/**
 * Renders its single child element with `props` merged in, for `asChild`
 * props: a component's styles and attributes go onto the caller's own element,
 * such as a router's Link. Classes are combined, styles merged (the child's
 * win), event handlers both run (the child's first), and refs both receive the
 * element; other props from the component win.
 */
export function Slot({ children, ...props }: ComponentProps<'a'> & { children?: ReactNode }) {
    if (!isValidElement(children)) return null;
    const child = children as ReactElement<Props>;
    const own = props as Props;
    const theirs = child.props;
    const merged: Props = { ...own };
    for (const key of Object.keys(own)) {
        const mine = own[key];
        const other = theirs[key];
        if (/^on[A-Z]/.test(key) && typeof mine === 'function' && typeof other === 'function') {
            merged[key] = (...args: unknown[]) => {
                other(...args);
                mine(...args);
            };
        }
    }
    merged.className = cx(own.className as string, theirs.className as string);
    if (own.style || theirs.style) merged.style = { ...(own.style as object), ...(theirs.style as object) };
    if (own.ref && theirs.ref) merged.ref = mergeRefs(own.ref as Ref<unknown>, theirs.ref as Ref<unknown>);
    return cloneElement(child, merged);
}

function mergeRefs<T>(...refs: Ref<T>[]) {
    return (node: T | null) => {
        for (const ref of refs) {
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
        }
    };
}
