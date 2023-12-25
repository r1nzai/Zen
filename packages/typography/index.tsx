import { ComponentProps } from '@zen/component';
import { VariantProps, cva } from '@zen/utils/cva';

export default function Typography(props: TypographyProps) {
    const { tag = 'p', variant, className, ...rest } = props;
    const Tag = tag;
    return <Tag {...rest} className={typographyVariants({ variant, className })} />;
}

const typographyVariants = cva('zen__typography', {
    variants: {
        variant: {
            h1: 'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl',
            h2: 'scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0',
            h3: 'scroll-m-20 text-2xl font-semibold tracking-tight',
            h4: 'scroll-m-20 text-xl font-semibold tracking-tight',
            p: 'leading-7  [&:not(:first-child)]:mt-6',
            blockquote: 'mt-6 border-l-2 pl-6 italic',
            code: 'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
            lead: 'text-xl text-muted-foreground',
            large: 'text-lg font-semibold',
            small: 'text-sm font-medium leading-none',
            muted: 'text-sm text-muted-foreground',
            free: '',
        },
    },
});
export type Level = 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span' | 'label';
export interface TypographyProps extends Omit<ComponentProps<Level>, 'tag'>, VariantProps<typeof typographyVariants> {
    tag?: Level;
}
