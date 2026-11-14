import { cloneElement, ComponentProps, isValidElement, ReactElement, ReactNode, Ref } from 'react';

import { cx } from './cx';
import { mergeRefs } from './refs';

type Props = Record<string, unknown>;

/**
 * Renders its single child element with `props` merged in, for `asChild`
 * props: a component's styles and attributes go onto the caller's own element,
 * such as a router's Link. Classes are combined, styles merged (the child's
 * win), event handlers both run (the child's first), and refs both receive the
 * element; other props from the component win. `before` goes ahead of the
 * child's own content (e.g. a component's icon), also when that content is a
 * render function such as a router NavLink's.
 */
export function Slot({
    before,
    children,
    ...props
}: ComponentProps<'a'> & { before?: ReactNode; children?: ReactNode }) {
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
    if (before != null) {
        const content = theirs.children;
        merged.children =
            typeof content === 'function' ? (
                (...args: unknown[]) => (
                    <>
                        {before}
                        {content(...args)}
                    </>
                )
            ) : (
                <>
                    {before}
                    {content as ReactNode}
                </>
            );
    }
    return cloneElement(child, merged);
}
