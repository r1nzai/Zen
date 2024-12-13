import React, { JSX, PropsWithChildren, ReactElement } from 'react';

const Component: BaseType = <Tag extends React.ElementType = 'div'>({
    tag,
    children,
    visible = true,
    asChild,
    ...rest
}: ComponentProps<Tag>) => {
    if (!visible) {
        return <></>;
    }
    if (asChild) {
        const slot = findTag(children);
        if (!slot) {
            return <></>;
        }
        const { Tag, props } = slot;
        return <Tag {...rest} {...props} />;
    }
    const Tag = tag ?? 'div';
    return <Tag {...rest}>{children}</Tag>;
};
const isValidTag = <Tag extends React.ElementType>(tag: unknown): tag is Tag => {
    return typeof tag === 'string';
};
const zen = new Proxy(
    {} as {
        [Tag in keyof JSX.IntrinsicElements]: React.FunctionComponent<ComponentProps<Tag>>;
    },
    {
        get: (_, tag) => {
            let actualTag = tag as React.ElementType;
            if (!isValidTag(tag)) {
                actualTag = 'div' as React.ElementType;
            }
            return function (props: ComponentProps<typeof actualTag>) {
                return <Component tag={actualTag} {...props} />;
            };
        },
    },
);
export default zen;
type TagProp<Tag extends React.ElementType> = {
    tag?: Tag;
    asChild?: boolean;
};

export type ComponentProps<Tag extends React.ElementType> = React.PropsWithChildren<TagProp<Tag>> &
    Omit<React.ComponentPropsWithRef<Tag>, keyof TagProp<Tag>> & {
        visible?: boolean;
    };
export type BaseType = <Tag extends React.ElementType = 'div'>(props: ComponentProps<Tag>) => React.ReactNode;

const findTag = (
    children: React.ReactNode,
):
    | {
          Tag: React.ElementType;
          props: PropsWithChildren;
      }
    | undefined => {
    if (typeof children === 'string') {
        return undefined;
    }
    if (Array.isArray(children)) {
        return children.reduce((acc, child) => {
            if (acc) {
                return acc;
            }
            return findTag(child);
        }, undefined);
    }
    if (typeof children === 'object' && children !== null) {
        return {
            Tag: (children as ReactElement).type as React.ElementType,
            props: (children as ReactElement).props as PropsWithChildren,
        };
    }
    return undefined;
};
