import React, { JSX, PropsWithChildren, ReactElement } from 'react';

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
