import Component, {BaseProps} from '@zen/component'
import {cva, VariantProps} from "@zen/utils/cva";

const Button = (props: ButtonProps) => {
    let {children, className, variant = "primary",size="medium",rounded="md"} = props
    return (
        <Component tag="button" className={ButtonStyles({variant,size,rounded, className})}>
            {children}
        </Component>
    )
}
const ButtonStyles = cva('zen__button inline-flex items-center justify-center transition font-semibold', {
    variants: {
        variant: {
            primary: "bg-primary hover:bg-primary/90 text-primary-foreground",
            secondary: "bg-secondary hover:bg-secondary/90 text-secondary-foreground",
            muted: "bg-muted hover:bg-muted/90 text-muted-foreground",
            destructive: "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
            link:"bg-transparent hover:underline text-primary-foreground",
        },
        size:{
            small:"text-sm px-2 py-1",
            medium:"text-md px-3 py-2",
            large:"text-lg px-4 py-3",
        },
        rounded:{
            none:"rounded-none",
            sm:"rounded-sm",
            md:"rounded-md",
            lg:"rounded-lg",
            xl:"rounded-xl",
            full:"rounded-full",
        }
    },
    defaultVariants: {
        variant: 'primary',
        size:"medium",
        rounded:"md"
    },
})

export interface ButtonProps extends BaseProps<'button'>, VariantProps<typeof ButtonStyles> {
}

export default Button
