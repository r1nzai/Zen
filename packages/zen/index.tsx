import React from 'react';

type TagProp<Tag extends React.ElementType> = {
    tag?: Tag;
    asChild?: boolean;
};

export type ComponentProps<Tag extends React.ElementType> = React.PropsWithChildren<TagProp<Tag>> &
    Omit<React.ComponentPropsWithRef<Tag>, keyof TagProp<Tag>> & {
        visible?: boolean;
    };
export type BaseType = <Tag extends React.ElementType = 'div'>(props: ComponentProps<Tag>) => React.ReactNode;
