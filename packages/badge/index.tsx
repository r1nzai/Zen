import { VariantProps, cva } from '@zen/utils/cva';
import { ComponentProps } from 'react';

export default function Badge({ variant, className, ...rest }: BadgeProps) {
    return <span {...rest} className={badgeVariants({ variant, className })} />;
}
const badgeVariants = cva(
    'zen__badge inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-glow/50',
    {
        variants: {
            variant: {
                default: 'border-glow/30 bg-glow/10 text-primary',
                // Sora only has the accent badge; the other tones reuse its tint and destructive recipes.
                secondary: 'border-tint/10 bg-tint/[0.06] text-foreground',
                destructive: 'border-destructive/40 bg-destructive/10 text-destructive',
                outline: 'border-tint/10 text-foreground',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);
export interface BadgeProps extends ComponentProps<'span'>, VariantProps<typeof badgeVariants> {}
