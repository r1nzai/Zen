import { Combobox, ComboboxEmpty, ComboboxList, ComboboxPopup, ComboboxSearch, ComboboxTrigger } from '@rinzai/zen';
import { useState } from 'react';

const ACCOUNTS = Array.from({ length: 2000 }, (_, i) => ({
    key: String(i + 1),
    text: `Account ${String(i + 1).padStart(4, '0')}`,
}));

/** 2,000 items: the list renders only the rows in view, so it opens and scrolls instantly. Type to filter. */
export default function ManyItems() {
    const [account, setAccount] = useState<string | null>('1');
    return (
        <Combobox items={ACCOUNTS} value={account} onValueChange={setAccount}>
            <ComboboxTrigger className="w-64" />
            <ComboboxPopup>
                <ComboboxSearch />
                <ComboboxList>
                    <ComboboxEmpty />
                </ComboboxList>
            </ComboboxPopup>
        </Combobox>
    );
}
