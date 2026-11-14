import {
    Combobox,
    ComboboxEmpty,
    ComboboxItem,
    ComboboxList,
    ComboboxPopup,
    ComboboxSearch,
    ComboboxTrigger,
} from '@rinzai/zen';
import { useState } from 'react';

interface Account {
    id: string;
    name: string;
    number: string;
}

const ACCOUNTS: Account[] = [
    { id: 'chk', name: 'Everyday checking', number: '•• 4821' },
    { id: 'sav', name: 'Rainy-day savings', number: '•• 0937' },
    { id: 'crd', name: 'Travel credit card', number: '•• 1150' },
    { id: 'brk', name: 'Brokerage', number: '•• 7302' },
];

/** Any shape of item (itemKey, itemText), your own rows, your own empty message. ↑↓ and Enter work in the search. */
export default function Accounts() {
    const [account, setAccount] = useState<string | null>('chk');
    return (
        <Combobox
            items={ACCOUNTS}
            itemKey={(a) => a.id}
            itemText={(a) => a.name}
            value={account}
            onValueChange={setAccount}
        >
            <ComboboxTrigger aria-label="Account" placeholder="Pick an account" className="w-72" />
            <ComboboxPopup>
                <ComboboxSearch placeholder="Search accounts" />
                <ComboboxList<Account>
                    renderItem={(a) => (
                        <ComboboxItem item={a}>
                            <span className="flex justify-between gap-3">
                                {a.name}
                                <span className="text-muted-foreground tabular-nums">{a.number}</span>
                            </span>
                        </ComboboxItem>
                    )}
                >
                    <ComboboxEmpty>No account by that name</ComboboxEmpty>
                </ComboboxList>
            </ComboboxPopup>
        </Combobox>
    );
}
