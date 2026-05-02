'use client';
import { useVirtualizer } from '@tanstack/react-virtual';
import ChevronUp from '@zen/icons/chevron-up';
import Search from '@zen/icons/search';
import XMark from '@zen/icons/x-mark';
import Popover from '@zen/popover';
import { cx } from '@zen/utils/cx';
import { ChangeEvent, ComponentProps, useId, useMemo, useRef, useState } from 'react';
import { Badge, Button, Collapse } from '..';
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
        mutable,
        onAdd,
    } = props;
    const ref = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const dropdownId = useId();
    return (
        <div>
            <button
                popoverTarget={`zen__dropdown-${dropdownId}`}
                className={cx(
                    'border-input bg-background inline-flex h-10 w-56 grow items-center justify-between rounded border-2 p-2 transition',
                    disabled ? 'bg-muted text-muted cursor-not-allowed' : 'cursor-pointer',
                    open && 'border-primary',
                    className,
                )}
            >
                <div
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
                            estimator={(_, textWidth) => textWidth + 40}
                            badgeVariant="secondary"
                            badgeStyles="bg-input! h-6 min-w-min gap-2 bg-input!"
                        >
                            {(item, index, data) => (
                                <Badge
                                    key={`collapsed_item_${index}`}
                                    className="bg-input! flex h-6 min-w-min gap-2 pr-1"
                                    variant={'secondary'}
                                >
                                    {item}
                                    <Button
                                        onClick={() => {
                                            onChange(selected.filter((item) => item.key !== data?.key));
                                        }}
                                        variant={'icon'}
                                        size={'icon'}
                                        className="group bg-muted hover:bg-muted-foreground p-0.5"
                                    >
                                        <XMark className="group-hover:text-muted size-3 transition duration-300 group-hover:rotate-90" />
                                    </Button>
                                </Badge>
                            )}
                        </Collapse>
                    ) : (
                        (selected.text ?? placeholder)
                    )}
                </div>
                <ChevronUp
                    className={cx(
                        'bg-input size-4 rounded-full p-0.5 transition duration-300 ease-in-out',
                        open ? 'rotate-180' : 'rotate-0',
                        disabled ? 'text-muted-foreground' : 'text-foreground',
                    )}
                />
            </button>
            <DropdownItemList
                id={`zen__dropdown-${dropdownId}`}
                {...(mutable ? { mutable, onAdd } : { mutable })}
                {...(multiple ? { multiple, items, onChange, selected } : { items, onChange, selected })}
            />
        </div>
    );
}
function DropdownItemList(
    props: (MultiSelectProps | SingleSelectProps) &
        (MutableDropdownProps | ImmutableDropdownProps) &
        DropdownProps & { id: string },
) {
    const { items, multiple, selected, onChange, mutable, onAdd } = props;
    const [search, setSearch] = useState('');
    const virtualRef = useRef<HTMLUListElement>(null);
    const filteredItems = useMemo(
        () =>
            items.reduce((acc, item) => {
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
    const selectedItems = selected instanceof Array ? selected.map((item) => item.key) : [selected.key];
    return (
        <div
            className="divide-border border-input bg-background fixed top-[calc(anchor(bottom)+5px)] min-w-[anchor-size(width)] flex-col divide-y-2 [justify-self:anchor-center] overflow-hidden rounded border [:popover-open]:flex"
            popover="auto"
            id={props.id}
        >
            <div className={cx('inline-flex grow items-center rounded px-3 py-2')}>
                <Search className="text-muted-foreground top-3 left-3 mr-2 size-4" />
                <input
                    className="text-foreground inline-flex grow bg-transparent text-sm outline-hidden"
                    placeholder="Search"
                    value={search}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                />
            </div>
            <ul
                className={cx('max-h-60 grow overflow-auto shadow-sm', 'focus:ring-0 focus:outline-hidden')}
                ref={virtualRef}
            >
                <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {rowVirtualizer.getVirtualItems().map((virtualItem) => (
                        <li
                            key={virtualItem.key}
                            style={{
                                height: `${virtualItem.size}px`,
                                transform: `translateY(${virtualItem.start}px)`,
                            }}
                            className={cx(
                                'text-foreground absolute top-0 left-0 w-full cursor-pointer px-3 py-2 text-sm transition',
                                selectedItems.includes(filteredItems[virtualItem.index].key)
                                    ? 'bg-primary/90 text-primary-foreground dark:text-foreground'
                                    : 'hover:bg-primary/60 hover:text-primary-foreground dark:hover:text-foreground',
                            )}
                            onClick={() => {
                                if (multiple) {
                                    if (selectedItems.includes(filteredItems[virtualItem.index].key)) {
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
                        </li>
                    ))}
                </div>
                {search.length > 0 &&
                    filteredItems.length === 0 &&
                    (mutable ? (
                        <li
                            className={cx('text-foreground px-3 py-2 text-sm')}
                            onClick={() => {
                                onAdd({ text: search, key: search });
                                setSearch('');
                            }}
                        >
                            Add {search}
                        </li>
                    ) : (
                        <li className={cx('text-foreground cursor-not-allowed px-3 py-2 text-sm')}>No results found</li>
                    ))}
            </ul>
        </div>
    );
}
export interface SingleSelectProps {
    selected: DropdownItem;
    onChange: (item: DropdownItem) => void;
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
