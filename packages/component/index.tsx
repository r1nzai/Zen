import { forwardRef } from 'react';

const Component: BaseType = forwardRef(
    <Tag extends React.ElementType = 'div'>(
        { tag, children, visible = true, ...rest }: ComponentProps<Tag>,
        ref: ComponentRef<Tag>,
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

export type ComponentProps<Tag extends React.ElementType> = React.PropsWithChildren<TagProp<Tag>> &
    Omit<React.ComponentPropsWithRef<Tag>, keyof TagProp<Tag>> & {
        visible?: boolean;
    };
export type ComponentRef<Tag extends React.ElementType> = React.ComponentPropsWithRef<Tag>['ref'];
export type BaseType = <Tag extends React.ElementType = 'div'>(
    props: ComponentProps<Tag>,
    ref: ComponentRef<Tag>,
) => React.ReactNode;
