import { cloneElement, ComponentProps, isValidElement, ReactElement, ReactNode } from 'react';

import { cx } from './cx';

/**
 * Renders its single child element with `props` merged in (classes combined),
 * for `asChild` props: a component's styles and attributes go onto the caller's
 * own element, such as a router's Link.
 */
export function Slot({ children, className, ...props }: ComponentProps<'a'> & { children?: ReactNode }) {
    if (!isValidElement(children)) return null;
    const child = children as ReactElement<ComponentProps<'a'>>;
    return cloneElement(child, { ...props, className: cx(className, child.props.className) });
}
