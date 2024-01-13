import Component, { ComponentProps } from '@zen/component';
import ChevronUp from '@zen/icons/chevron-up';
import Search from '@zen/icons/search';
import Popover from '@zen/popover';
import { cx } from '@zen/utils/cx';
import { ChangeEvent, useMemo, useRef, useState } from 'react';
import Container from '@zen/container';
import { Badge, Button, Collapse } from '..';
import XMark from '@zen/icons/x-mark';
import { useVirtualizer } from '@tanstack/react-virtual';
export default function Dropdown(
    props: (MultiSelectProps | SingleSelectProps) &
        (MutableDropdownProps | ImmutableDropdownProps) &
        DropdownProps &
        Omit<ComponentProps<'input'>, 'onChange'>,
) {
    const {
        items,
        selected,
        className,
        onChange,
        disabled,
        placeholder = 'Select an Item',
        multiple,
        width = '215px',
        height = '40px',
        mutable,
        onAdd,
        ...rest
    } = props;
    const ref = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    return (
        <Popover
            placement="bottom"
            trigger="click"
            show={open}
            setShow={setOpen}
            role="combobox"
            disabled={disabled}
            content={
                <DropdownItemList
                    {...(mutable ? { mutable, onAdd } : { mutable })}
                    {...(multiple ? { multiple, items, onChange, selected } : { items, onChange, selected })}
                    width={width}
                />
            }
        >
            <Container
                style={{ width, height }}
                className={cx(
                    'inline-flex grow items-center justify-between rounded border-2 border-input bg-background p-2 transition',
                    disabled ? 'cursor-not-allowed bg-muted text-muted' : 'cursor-pointer',
                    open && 'border-primary shadow-sm shadow-ring',
                    className,
                )}
            >
                <Container
                    className={cx(
                        'flex max-w-[calc(100%-30px)] flex-none grow items-center gap-1 text-sm',
                        disabled ? 'text-muted-foreground' : 'text-foreground',
                    )}
                    ref={ref}
                >
                    {multiple ? (
                        <Collapse
                            items={selected.map((item) => item.text)}
                            data={selected}
                            parentRef={ref}
                            badgeVariant="secondary"
                            badgeStyles="!bg-input h-6 min-w-min gap-2 !bg-input"
                        >
                            {(item, index, data) => (
                                <Badge
                                    key={`collapsed_item_${index}`}
                                    className="flex h-6 min-w-min gap-2 !bg-input pr-1"
                                    variant={'secondary'}
                                >
                                    {item}
                                    <Button
                                        onClick={() => {
                                            onChange(selected.filter((item) => item.key !== data?.key));
                                        }}
                                        variant={'icon'}
                                        size={'icon'}
                                        className="group bg-muted p-0.5 hover:bg-muted-foreground "
                                    >
                                        <XMark className="size-3 transition duration-300 group-hover:rotate-90  group-hover:text-muted" />
                                    </Button>
                                </Badge>
                            )}
                        </Collapse>
                    ) : (
                        selected.text ?? 'Select an item'
                    )}
                </Container>
                <ChevronUp
                    className={cx(
                        'size-4 rounded-full bg-input p-0.5 transition duration-300 ease-in-out',
                        open ? 'rotate-180' : 'rotate-0',
                        disabled ? 'text-muted-foreground' : 'text-foreground',
                    )}
                />
            </Container>
        </Popover>
    );
}
export interface SingleSelectProps {
    selected: DropdownItem;
    onChange: (key: DropdownItem) => void;
    multiple?: false;
}
export interface MultiSelectProps {
    selected: DropdownItem[];
    onChange: (items: DropdownItem[]) => void;
    multiple: true;
}
export interface DropdownProps {
    items: DropdownItem[];
}
export interface MutableDropdownProps {
    mutable: true;
    onAdd: (item: DropdownItem) => void;
}
export interface ImmutableDropdownProps {
    mutable?: never;
    onAdd?: never;
}
export type DropdownItem = {
    text: string;
    key: string;
};

const DropdownItemList = (
    props: (MultiSelectProps | SingleSelectProps) &
        (MutableDropdownProps | ImmutableDropdownProps) &
        DropdownProps & { width: string | number },
) => {
    const { items, multiple, selected, onChange, width, mutable, onAdd } = props;
    const [search, setSearch] = useState('');
    const virtualRef = useRef<HTMLUListElement>(null);
    const filteredItems = useMemo(
        () =>
            items.reduce((acc, item, index, array) => {
                if (search.length ? item.text.toLowerCase().includes(search.toLowerCase()) : true) {
                    acc.push(item);
                }
                return acc;
            }, [] as DropdownItem[]),
        [items, search],
    );
    const rowVirtualizer = useVirtualizer({
        count: filteredItems.length,
        getScrollElement: () => virtualRef.current,
        estimateSize: () => 35,
    });
    const selectedItems = selected instanceof Array ? selected : [selected];
    return (
        <Container
            className="flex flex-col divide-y-2 divide-border overflow-hidden rounded border border-input bg-background"
            style={{ width }}
        >
            <Container className={cx('inline-flex grow items-center rounded px-3 py-2')}>
                <Search className="left-3 top-3 mr-2 size-4 text-muted-foreground" />
                <Component
                    tag="input"
                    className="inline-flex grow bg-transparent text-sm text-foreground outline-none"
                    placeholder="Search"
                    value={search}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                />
            </Container>
            <Component
                tag="ul"
                className={cx('max-h-60 grow overflow-auto shadow', 'focus:outline-none focus:ring-0')}
                ref={virtualRef}
            >
                <Container
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {rowVirtualizer.getVirtualItems().map((virtualItem) => (
                        <Component
                            tag="li"
                            key={virtualItem.key}
                            style={{
                                height: `${virtualItem.size}px`,
                                transform: `translateY(${virtualItem.start}px)`,
                            }}
                            className={cx(
                                'absolute left-0 top-0 w-full cursor-pointer px-3 py-2 text-sm text-foreground',
                                selectedItems.some((item) => item.key === filteredItems[virtualItem.index].key)
                                    ? 'bg-primary/90 text-primary-foreground'
                                    : 'transition hover:bg-primary/60',
                            )}
                            onClick={() => {
                                if (multiple) {
                                    if (
                                        selectedItems.some((item) => item.key === filteredItems[virtualItem.index].key)
                                    ) {
                                        onChange(
                                            structuredClone(
                                                selected.filter(
                                                    (selectedItem) =>
                                                        selectedItem.key !== filteredItems[virtualItem.index].key,
                                                ),
                                            ),
                                        );
                                    } else {
                                        onChange(structuredClone([...selected, filteredItems[virtualItem.index]]));
                                    }
                                } else {
                                    onChange(filteredItems[virtualItem.index]);
                                }
                            }}
                        >
                            {filteredItems[virtualItem.index].text}
                        </Component>
                    ))}
                </Container>
                {filteredItems.length === 0 &&
                    (mutable ? (
                        <Component
                            tag="li"
                            className={cx('px-3  py-2 text-sm text-foreground')}
                            onClick={() => {
                                onAdd({ text: search, key: search });
                                setSearch('');
                            }}
                        >
                            Add {search}
                        </Component>
                    ) : (
                        <Component tag="li" className={cx('cursor-not-allowed px-3  py-2 text-sm text-foreground')}>
                            No results found
                        </Component>
                    ))}
            </Component>
        </Container>
    );
};
