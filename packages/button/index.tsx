import { cva, VariantProps } from '@zen/utils/cva';
import { ComponentProps } from 'react';

export default function Button({ className, variant, size, ...rest }: ButtonProps) {
    return <button className={buttonVariants({ variant, size, className })} {...rest} />;
}
const buttonVariants = cva(
    'zen__button inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/70 active:bg-primary/90',
                destructive:
                    'bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/70 active:bg-destructive',
                outline:
                    'border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground active:bg-accent',
                secondary:
                    'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/70 active:bg-secondary/90',
                ghost: 'hover:bg-accent hover:text-accent-foreground active:bg-accent',
                link: 'text-primary underline-offset-4 hover:underline active:underline',
                icon: '',
            },
            size: {
                default: 'h-9 px-4 py-2',
                sm: 'h-8 rounded-md px-3 text-xs',
                lg: 'h-10 rounded-md px-8',
                icon: '',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

export interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {}
