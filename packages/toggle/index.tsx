import { cx } from '@zen/utils/cx';
import zen, { ComponentProps } from '@zen/zen';

export interface ToggleProps extends Omit<ComponentProps<'input'>, 'onChange'> {
    onChange?: (e: boolean) => void;
}

export default function Toggle(props: ToggleProps) {
    const { className, checked, onChange, defaultChecked, ...rest } = props;
    return (
        <zen.div
            className={cx(
                'rounded-full',
                'h-5 w-10',
                'border border-muted bg-secondary',
                'flex items-center',
                className,
            )}
            onClick={() => onChange?.(!checked)}
        >
            <zen.input type="hidden" readOnly {...rest} {...{ defaultChecked, checked }} />
            <zen.div
                className={cx(
                    '[animation-timing-function:cubic-bezier(1, 0, 0, 1)] duration-250 h-4 w-4 rounded-full bg-primary transition-all',
                    checked ? 'translate-x-5' : 'translate-x-1',
                )}
            />
        </zen.div>
    );
}
