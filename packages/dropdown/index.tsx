import { useVirtualizer } from '@tanstack/react-virtual';
import Search from '@zen/icons/search';
import XMark from '@zen/icons/x-mark';
import Popover from '@zen/popover';
import { cx } from '@zen/utils/cx';
import { TRIGGER, TRIGGER_OPEN } from '@zen/utils/styles';
import { ChangeEvent, ComponentProps, useMemo, useRef, useState } from 'react';
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
    // cx doesn't resolve Tailwind conflicts: only use the default width when the caller sets none.
    const sized = !!className && /(^|\s)(w-|min-w-|max-w-)/.test(className);
    const fullWidth = !!className && /(^|\s)w-full(\s|$)/.test(className);
    return (
        <Popover
            triggerClassName={fullWidth ? 'w-full max-w-none' : undefined}
            content={
                <DropdownItemList
                    {...(mutable ? { mutable, onAdd } : { mutable })}
                    {...(multiple ? { multiple, items, onChange, selected } : { items, onChange, selected })}
                />
            }
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
        >
            <div
                role="combobox"
                aria-expanded={open}
                aria-haspopup="listbox"
                className={cx(
                    TRIGGER,
                    !sized && 'w-56',
                    'grow',
                    disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                    open && TRIGGER_OPEN,
                    className,
                )}
            >
                <div
                    className={cx(
                        // Takes all the space beside the chevron, whatever its content: Collapse measures this box.
                        'flex min-w-0 flex-1 items-center gap-1 overflow-hidden text-sm',
                        disabled ? 'text-muted-foreground' : 'text-foreground',
                    )}
                    ref={ref}
                >
                    {multiple && !selected.length ? (
                        <span className="text-muted-foreground">{placeholder}</span>
                    ) : multiple ? (
                        <Collapse
                            items={selected.map((item) => item.text)}
                            data={selected}
                            parentRef={ref}
                            estimator={(_, textWidth) => textWidth + 40}
                            badgeVariant="secondary"
                            badgeStyles="h-6 min-w-min gap-2"
                        >
                            {(item, index, data) => (
                                <Badge
                                    key={`collapsed_item_${data?.key ?? index}`}
                                    className="flex h-6 min-w-min gap-2 pr-1"
                                    variant={'secondary'}
                                >
                                    {item}
                                    <Button
                                        onClick={() => {
                                            onChange(selected.filter((item) => item.key !== data?.key));
                                        }}
                                        variant={'icon'}
                                        size={'icon'}
                                        className="group size-4 rounded-sm p-0.5"
                                    >
                                        <XMark className="size-3 transition duration-300 group-hover:rotate-90" />
                                    </Button>
                                </Badge>
                            )}
                        </Collapse>
                    ) : (
                        (selected.text ?? placeholder)
                    )}
                </div>
                <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                    className={cx(
                        'text-muted-foreground size-4 shrink-0 transition-transform duration-300',
                        open && 'rotate-180',
                    )}
                >
                    <path d="m4 6 4 4 4-4" />
                </svg>
            </div>
        </Popover>
    );
}
function DropdownItemList(
    props: (MultiSelectProps | SingleSelectProps) & (MutableDropdownProps | ImmutableDropdownProps) & DropdownProps,
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
        <div className="divide-tint/10 flex w-full flex-col divide-y overflow-hidden rounded-xl">
            <div className={cx('flex grow items-center rounded px-3 py-2')}>
                <Search className="text-muted-foreground mr-2 size-4" />
                <input
                    className="text-foreground inline-flex grow bg-transparent text-sm outline-hidden"
                    placeholder="Search"
                    value={search}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                />
            </div>
            <ul
                role="listbox"
                className={cx('max-h-72 grow overflow-y-auto py-1', 'focus:ring-0 focus:outline-hidden')}
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
                            role="option"
                            aria-selected={selectedItems.includes(filteredItems[virtualItem.index].key)}
                            style={{
                                height: `${virtualItem.size}px`,
                                transform: `translateY(${virtualItem.start}px)`,
                            }}
                            className={cx(
                                'hover:bg-muted absolute top-0 left-0 grid w-full cursor-pointer grid-cols-[1rem_1fr] items-center gap-2 px-3 py-2 text-sm outline-hidden select-none',
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
                            <span className="text-primary col-start-1" aria-hidden>
                                {selectedItems.includes(filteredItems[virtualItem.index].key) && '✓'}
                            </span>
                            <span className="col-start-2 truncate">{filteredItems[virtualItem.index].text}</span>
                        </li>
                    ))}
                </div>
                {search.length > 0 &&
                    filteredItems.length === 0 &&
                    (mutable ? (
                        <li
                            role="option"
                            aria-selected={false}
                            className={cx('hover:bg-muted cursor-pointer px-3 py-2 text-sm select-none')}
                            onClick={() => {
                                onAdd({ text: search, key: search });
                                setSearch('');
                            }}
                        >
                            Add {search}
                        </li>
                    ) : (
                        <li
                            role="option"
                            aria-selected={false}
                            className={cx('text-muted-foreground cursor-not-allowed px-3 py-2 text-sm')}
                        >
                            No results found
                        </li>
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
