import { VariantProps, cva } from '@zen/utils/cva';
import { ComponentProps } from 'react';

export default function Badge({ variant, className, ...rest }: BadgeProps) {
    return <span {...rest} className={badgeVariants({ variant, className })} />;
}
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
