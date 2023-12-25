import Component, { BaseProps } from '@zen/component';
import ChevronDown from '@zen/icons/chevron-down';
import ChevronUp from '@zen/icons/chevron-up';
import Popover from '@zen/popover';
import { cx } from '@zen/utils/cx';
import { Container } from '..';

export default function Dropdown(props: DropdownProps) {
    const { items, width = '215px', height = '40px', selectedKey, onChange } = props;
    return (
        <Container>
            <Popover
                placement="bottom"
                trigger="click"
                content={
                    <Component
                        tag="ul"
                        className={cx('')}
                        style={{
                            width: width,
                        }}
                    >
                        {items.map((item) => (
                            <Component
                                tag="li"
                                key={item.key}
                                className={cx(
                                    'cursor-pointer px-3 py-2  text-sm text-foreground',
                                    selectedKey === item.key
                                        ? 'bg-primary/90 text-primary-foreground'
                                        : 'duration-20 transition hover:bg-primary/60',
                                )}
                                onClick={() => onChange(item.key)}
                            >
                                {item.text}
                            </Component>
                        ))}
                    </Component>
                }
            >
                {(open) => (
                    <Container
                        className={cx(
                            'flex cursor-pointer items-center justify-between rounded border-2 px-3 py-2 transition',
                            open ? 'border-primary shadow-sm shadow-ring' : 'border-input',
                        )}
                        style={{ width: width, height: height }}
                    >
                        <Container className="text-sm text-foreground">
                            {items.find((item) => item.key === selectedKey)?.text}
                        </Container>
                        <Container className="text-sm text-foreground">
                            <ChevronDown className={cx('size-4', open ? '' : 'rotate-180 transform')} />
                        </Container>
                    </Container>
                )}
            </Popover>
        </Container>
    );
}

export interface DropdownProps extends Omit<BaseProps<'div'>, 'onChange'> {
    items: DropdownItem[];
    onChange: (key: string) => void;
    selectedKey: string;
    width?: string;
    height?: string;
}
type DropdownItem = {
    text: string;
    key: string;
};
