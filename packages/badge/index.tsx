import { ComponentProps } from '@zen/component';
import Container from '@zen/container';
import { VariantProps, cva } from '@zen/utils/cva';
import { forwardRef } from 'react';

export default forwardRef<HTMLDivElement, BadgeProps>(function Badge(props, ref) {
    const { variant, className, ...rest } = props;
    return <Container {...rest} className={badgeVariants({ variant, className })} ref={ref} />;
});
const badgeVariants = cva(
    'zen__badge inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors whitespace-nowrap',
    {
        variants: {
            variant: {
                default: 'border-transparent bg-primary text-primary-foreground shadow',
                secondary: 'border-transparent bg-secondary text-secondary-foreground',
                destructive: 'border-transparent bg-destructive text-destructive-foreground shadow',
                outline: 'text-foreground',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);
export interface BadgeProps extends Omit<ComponentProps<'div'>, 'tag'>, VariantProps<typeof badgeVariants> {}
