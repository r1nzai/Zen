import { cx } from '@zen/utils/cx';
import { Slot } from '@zen/utils/slot';
import { ComponentProps } from 'react';

const TILE = {
    default: 'bg-tint/[0.03]',
    positive: 'bg-primary/10',
    negative: 'bg-destructive/10',
};
const PANEL = {
    default: 'border-tint/[0.08] bg-tint/[0.03]',
    positive: 'border-primary/30 bg-primary/[0.07]',
    negative: 'border-destructive/35 bg-destructive/[0.08]',
};

/**
 * A faint box set into a card or dialog: a small tile for one figure (e.g.
 * "Next EMI"), or with `bordered`, a panel for a result or a note. `tone`
 * tints it for good or bad news. With `asChild`, your own element (a <p>, a
 * status region) gets its look.
 */
export default function Inset({ bordered = false, tone = 'default', asChild, className, ...rest }: InsetProps) {
    const props = {
        ...rest,
        className: cx(
            'zen__inset',
            bordered ? cx('rounded-xl border p-4', PANEL[tone]) : cx('rounded-lg px-3 py-2.5', TILE[tone]),
            className,
        ),
    };
    if (asChild) return <Slot {...(props as ComponentProps<'a'>)} />;
    return <div {...props} />;
}

export interface InsetProps extends ComponentProps<'div'> {
    /** A bordered panel instead of a small tile. */
    bordered?: boolean;
    tone?: 'default' | 'positive' | 'negative';
    /** Put the look on your single child element instead of a <div>. */
    asChild?: boolean;
}
