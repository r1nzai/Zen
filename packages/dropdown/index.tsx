import Combobox, {
    ComboboxCreate,
    ComboboxEmpty,
    ComboboxList,
    ComboboxPopup,
    ComboboxSearch,
    ComboboxTrigger,
} from '@zen/combobox';
import { ComponentProps } from 'react';

/**
 * Searchable single or multiple selection of `{ text, key }` items, with
 * optional creation of new ones (`mutable`). Built from the Combobox parts;
 * compose those directly for any other shape of item or layout.
 */
export default function Dropdown(
    props: (MultiSelectProps | SingleSelectProps) &
        (MutableDropdownProps | ImmutableDropdownProps) &
        DropdownProps &
        Omit<ComponentProps<'input'>, 'onChange'>,
) {
    const { items, className, disabled, placeholder = 'Select an Item', mutable, onAdd } = props;
    // Chosen items that aren't (or aren't yet) in `items` still show and stay chosen.
    const selected = props.multiple ? props.selected : [props.selected];
    const known = new Map<string, DropdownItem>();
    for (const item of [...selected, ...items]) known.set(item.key, item);

    const inner = (
        <>
            <ComboboxTrigger placeholder={placeholder} disabled={disabled} className={className} />
            <ComboboxPopup>
                <ComboboxSearch />
                <ComboboxList>
                    {mutable ? <ComboboxCreate onCreate={(text) => onAdd({ text, key: text })} /> : <ComboboxEmpty />}
                </ComboboxList>
            </ComboboxPopup>
        </>
    );

    return props.multiple ? (
        <Combobox
            multiple
            items={items}
            selectedItems={selected}
            value={props.selected.map((s) => s.key)}
            onValueChange={(keys) => props.onChange(keys.map((k) => known.get(k)!).filter(Boolean))}
        >
            {inner}
        </Combobox>
    ) : (
        <Combobox
            items={items}
            selectedItems={selected}
            value={props.selected.key ?? null}
            onValueChange={(key) => props.onChange(known.get(key)!)}
        >
            {inner}
        </Combobox>
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
