import { forwardRef } from 'react';

const Component = forwardRef(
    <Tag extends React.ElementType = 'div'>(
        { tag, children, visible = true, ...rest }: BaseProps<Tag>,
        ref: BaseRef<Tag>,
    ) => {
        const Tag = tag || 'div';
        if (!visible) {
            return <></>;
        }
        return (
            <Tag ref={ref} {...rest}>
                {children}
            </Tag>
        );
    },
);
export default Component;

type TagProp<Tag extends React.ElementType> = {
    tag?: Tag;
};

type PropsToOmit<Tag extends React.ElementType, P> = keyof (TagProp<Tag> & P);

type PolyMorphicProps<Tag extends React.ElementType, Props = object> = React.PropsWithChildren<Props & TagProp<Tag>> &
    Omit<React.ComponentPropsWithoutRef<Tag>, PropsToOmit<Tag, Props>>;

type BasePropWithRef<Tag extends React.ElementType, Props = object> = PolyMorphicProps<Tag, Props> & {
    ref?: BaseRef<Tag>;
};

export type BaseRef<Tag extends React.ElementType> = React.ComponentPropsWithRef<Tag>['ref'];

export type BaseProps<Tag extends React.ElementType> = BasePropWithRef<Tag, { visible?: boolean }>;
