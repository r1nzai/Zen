import { cx } from '@zen/utils/cx';
import { AlertIcon, CheckIcon, InfoIcon } from '@zen/utils/status-icons';
import { ComponentProps, ReactNode } from 'react';

const TONE = {
    default: {
        icon: InfoIcon,
        box: 'border-tint/[0.08] bg-tint/[0.03] text-muted-foreground',
        plain: 'text-muted-foreground',
    },
    positive: { icon: CheckIcon, box: 'border-primary/30 bg-primary/10 text-primary', plain: 'text-primary' },
    negative: {
        icon: AlertIcon,
        box: 'border-destructive/35 bg-destructive/10 text-destructive',
        plain: 'text-destructive',
    },
};

/**
 * A message beside the content it's about: a notice, a warning, a failure.
 * A tinted box by default, or with `plain`, just the icon and text in the
 * tone's colour. With a `title`, the title takes the tone and the text under
 * it is quieter. Bad news is announced at once (role="alert"), anything else
 * politely (role="status"); pass `role` to change that, e.g. "note" for a
 * message that doesn't change.
 */
export default function Alert({
    tone = 'default',
    plain = false,
    title,
    icon,
    className,
    children,
    ...rest
}: AlertProps) {
    const t = TONE[tone];
    const Icon = t.icon;
    return (
        <div
            role={tone === 'negative' ? 'alert' : 'status'}
            {...rest}
            className={cx(
                'zen__alert flex items-start gap-2 text-sm',
                plain ? t.plain : cx('rounded-lg border px-3 py-2', t.box),
                className,
            )}
        >
            {icon !== null && (
                <span aria-hidden className="mt-0.5 flex shrink-0">
                    {icon ?? <Icon />}
                </span>
            )}
            {title ? (
                <div className="flex min-w-0 flex-col gap-1">
                    <p className="font-medium">{title}</p>
                    <div className="text-muted-foreground">{children}</div>
                </div>
            ) : (
                <div className="min-w-0">{children}</div>
            )}
        </div>
    );
}

export interface AlertProps extends Omit<ComponentProps<'div'>, 'title'> {
    /** `positive` in the accent colour, `negative` in red for bad news. */
    tone?: 'default' | 'positive' | 'negative';
    /** Just the icon and text, no box: for a line inside a form or a card. */
    plain?: boolean;
    /** A first line in the tone's colour; the text under it is quieter. */
    title?: ReactNode;
    /** Replaces the tone's icon (info, check, warning); `null` for none. */
    icon?: ReactNode;
}
