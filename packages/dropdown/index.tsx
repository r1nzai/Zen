import Component, { ComponentProps } from '@zen/component';
import ChevronUp from '@zen/icons/chevron-up';
import Search from '@zen/icons/search';
import Popover from '@zen/popover';
import { cx } from '@zen/utils/cx';
import { ChangeEvent, useMemo, useRef, useState } from 'react';
import Container from '@zen/container';
import { Badge, Collapse } from '..';
export default function Dropdown(props: SingleSelectDropDownProps | MultiSelectDropDownProps) {
    const {
        items,
        width = '215px',
        height = '40px',
        selected,
        onChange,
        disabled,
        placeholder = 'Select an Item',
        multiple,
        ...rest
    } = props;
    const [search, setSearch] = useState('');
    const selectedKeys = useMemo(() => {
        if (multiple) {
            return selected.map((item) => item.key);
        }
        return [selected.key];
    }, [selected, multiple, items]);
    console.log(selectedKeys);
    const ref = useRef<HTMLDivElement>(null);
    return (
        <Container>
            <Popover
                placement="bottom"
                trigger="click"
                role="combobox"
                disabled={disabled}
                content={
                    <Container className="flex flex-col divide-y-2 overflow-hidden rounded border border-input bg-background">
                        <Container className={cx('inline-flex grow items-center rounded px-3 py-2')}>
                            <Search className="left-3 top-3 mr-2 size-4 text-muted-foreground" />
                            <Component
                                tag="input"
                                className="inline-flex grow text-sm text-foreground outline-none"
                                placeholder="Search"
                                value={search}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                            />
                        </Container>
                        <Component
                            tag="ul"
                            className={cx('overflow-hidden shadow')}
                            style={{
                                width: width,
                            }}
                        >
                            {items.reduce((acc, item, index, array) => {
                                if (search.length ? item.text.toLowerCase().includes(search.toLowerCase()) : true) {
                                    acc.push(
                                        <Component
                                            tag="li"
                                            key={item.key}
                                            className={cx(
                                                'cursor-pointer px-3  py-2 text-sm text-foreground',
                                                selectedKeys.includes(item.key)
                                                    ? 'bg-primary/90 text-primary-foreground'
                                                    : 'transition hover:bg-primary/60',
                                            )}
                                            onClick={() => {
                                                if (multiple) {
                                                    if (selectedKeys.includes(item.key)) {
                                                        onChange(
                                                            structuredClone(
                                                                selected.filter(
                                                                    (selectedItem) => selectedItem.key !== item.key,
                                                                ),
                                                            ),
                                                        );
                                                    } else {
                                                        onChange(structuredClone([...selected, item]));
                                                    }
                                                } else {
                                                    onChange(item);
                                                }
                                            }}
                                        >
                                            {item.text}
                                        </Component>,
                                    );
                                }
                                if (index === array.length - 1 && acc.length === 0) {
                                    acc.push(
                                        <Component
                                            tag="li"
                                            key={`${item.key}_${index}`}
                                            className={cx('cursor-not-allowed px-3  py-2 text-sm text-foreground')}
                                        >
                                            No results found
                                        </Component>,
                                    );
                                }
                                return acc;
                            }, [] as React.ReactNode[])}
                        </Component>
                    </Container>
                }
            >
                {(open) => (
                    <Container
                        className={cx(
                            'inline-flex grow  items-center rounded border-2 border-input p-2 transition',
                            disabled ? 'cursor-not-allowed bg-muted text-muted' : 'cursor-pointer',
                            open && 'border-primary shadow-sm shadow-ring',
                        )}
                        style={{ width: width, height: height }}
                    >
                        {multiple ? (
                            <Container
                                className={cx(
                                    'flex grow text-sm',
                                    disabled ? 'text-muted-foreground' : 'text-foreground',
                                )}
                            >
                                <Collapse items={selected.map((item) => item.text)} data={selected} parentRef={ref}>
                                    {(item, index, data) => (
                                        <Badge key={data?.key} className="min-w-fit">
                                            {item}
                                        </Badge>
                                    )}
                                </Collapse>
                            </Container>
                        ) : (
                            <Container
                                className={cx(
                                    'flex grow text-sm',
                                    disabled ? 'text-muted-foreground' : 'text-foreground',
                                )}
                            >
                                {items.find((item) => item.key === selectedKeys[0])?.text ?? 'Select an item'}
                            </Container>
                        )}
                        <ChevronUp
                            className={cx(
                                'size-4 rounded-full bg-input p-0.5 transition-transform ease-in-out',
                                open ? 'rotate-180' : 'rotate-0',
                                disabled ? 'text-muted-foreground' : 'text-foreground',
                            )}
                        />
                    </Container>
                )}
            </Popover>
        </Container>
    );
}
export interface SingleSelectDropDownProps extends DropdownProps {
    selected: DropdownItem;
    onChange: (key: DropdownItem) => void;
    multiple?: never;
}
export interface MultiSelectDropDownProps extends DropdownProps {
    selected: DropdownItem[];
    onChange: (items: DropdownItem[]) => void;
    multiple: true;
}
interface DropdownProps extends Omit<ComponentProps<'input'>, 'onChange'> {
    items: DropdownItem[];
    width?: string;
    height?: string;
}
type DropdownItem = {
    text: string;
    key: string;
};
