import ChevronDownMicro from '@zen/icons/micro/chevron-down';

import { cx } from './cx';

/** Chevron for popup fields (select, month picker): turns over while the popup is open. */
export function FieldChevron({ open, className }: { open?: boolean; className?: string }) {
    return (
        <ChevronDownMicro
            className={cx(
                'zen__field-chevron text-muted-foreground size-4 shrink-0 transition-transform duration-300',
                open && 'rotate-180',
                className,
            )}
        />
    );
}
