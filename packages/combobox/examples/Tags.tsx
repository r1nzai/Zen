import { Combobox, ComboboxCreate, ComboboxList, ComboboxPopup, ComboboxSearch, ComboboxTrigger } from '@rinzai/zen';
import { useState } from 'react';

const asText = (tag: string) => tag;

/** Several at once (chips, removable), and typing a new name offers to add it: ComboboxCreate (Enter works too). */
export default function Tags() {
    const [tags, setTags] = useState(['Essential', 'Shared', 'Work', 'Treat', 'Annual']);
    const [chosen, setChosen] = useState(['Essential', 'Shared']);
    return (
        <Combobox multiple items={tags} itemKey={asText} itemText={asText} value={chosen} onValueChange={setChosen}>
            <ComboboxTrigger placeholder="No tags" className="w-80" />
            <ComboboxPopup>
                <ComboboxSearch />
                <ComboboxList>
                    <ComboboxCreate
                        onCreate={(tag) => {
                            setTags((all) => [...all, tag]);
                            setChosen((c) => [...c, tag]);
                        }}
                    />
                </ComboboxList>
            </ComboboxPopup>
        </Combobox>
    );
}
