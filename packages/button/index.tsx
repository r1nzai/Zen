import Spinner from '@zen/spinner';
import { Slot } from '@zen/utils/slot';
import { cva, VariantProps } from '@zen/utils/cva';
import { ComponentProps } from 'react';

/**
 * A button in one of Zen's styles. With `asChild`, the styles go onto your own
 * single child element instead, such as a router's Link (`loading` and `type`
 * then don't apply).
 */
export default function Button({
    className,
    variant,
    size,
    loading = false,
    disabled,
    type = 'button',
    asChild = false,
    children,
    ...rest
}: ButtonProps) {
    if (asChild) {
        return (
            <Slot {...(rest as ComponentProps<'a'>)} className={buttonVariants({ variant, size, className })}>
                {children}
            </Slot>
        );
    }
    return (
        <button
            // A plain action by default, so it never submits a form by accident; pass type="submit" to submit.
            type={type}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            className={buttonVariants({ variant, size, className })}
            {...rest}
        >
            {loading && <Spinner />}
            {children}
        </button>
    );
}

export const buttonVariants = cva(
    'zen__button inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap outline-hidden select-none ' +
        'transition-[background-color,border-color,box-shadow,color,transform] duration-200 ease-out active:scale-[0.97] ' +
        'focus-visible:ring-2 focus-visible:ring-glow/50 disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                default:
                    'bg-primary bg-[linear-gradient(to_bottom,oklch(1_0_0/0.16),transparent)] text-primary-foreground ' +
                    'shadow-[0_0_0_1px_oklch(var(--glow)/0.55),0_0_22px_-6px_oklch(var(--glow)/0.7),inset_0_1px_0_hsl(0_0%_100%/0.3)] ' +
                    'hover:shadow-[0_0_0_1px_oklch(var(--glow)/0.8),0_0_28px_-4px_oklch(var(--glow)/0.85),inset_0_1px_0_hsl(0_0%_100%/0.35)]',
                // Tonal: a soft fill in the accent colour, for the second action beside a primary one.
                secondary:
                    'bg-primary/15 text-foreground shadow-[inset_0_0_0_1px_oklch(var(--primary)/0.25)] hover:bg-primary/25',
                // Clear with a hairline border that catches the pointer light, like cards.
                outline:
                    'glow-edge border border-tint/10 bg-tint/[0.03] text-foreground hover:border-tint/20 hover:bg-tint/[0.07]',
                ghost: 'text-muted-foreground hover:bg-tint/[0.06] hover:text-foreground',
                destructive:
                    'bg-destructive/90 text-destructive-foreground shadow-[0_0_0_1px_oklch(var(--destructive)/0.6),0_0_22px_-8px_oklch(var(--destructive)/0.7)] hover:bg-destructive',
                link: 'h-auto! px-0! text-primary underline-offset-4 hover:underline',
                // Square ghost button for a lone icon (Sora's menu trigger).
                // Keeps its hover look while the popup it opened is showing (e.g. a Menu's "⋯").
                icon: 'text-muted-foreground hover:bg-tint/[0.06] hover:text-foreground',
            },
            size: {
                default: 'h-10 px-4',
                sm: 'h-8 px-3 text-xs',
                lg: 'h-11 px-6',
                icon: 'size-9',
                // A small square for a lone icon inside a row (e.g. "add item").
                'icon-sm': 'size-6 rounded-md',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

export interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
    /** Shows a spinner and disables the button while an action runs. */
    loading?: boolean;
    /** Put the button's styles on the single child element (e.g. a link) instead of a <button>. */
    asChild?: boolean;
}
