import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';

import Combobox, {
    ComboboxCreate,
    ComboboxEmpty,
    ComboboxItem,
    ComboboxList,
    ComboboxPopup,
    ComboboxSearch,
    ComboboxTrigger,
} from './index';

interface Account {
    id: string;
    name: string;
}
const ACCOUNTS: Account[] = [
    { id: 'chk', name: 'Checking' },
    { id: 'sav', name: 'Savings' },
    { id: 'crd', name: 'Credit card' },
];

function Single({ disabled = false }: { disabled?: boolean }) {
    const [value, setValue] = useState<string | null>(null);
    return (
        <Combobox
            items={ACCOUNTS}
            itemKey={(a) => a.id}
            itemText={(a) => a.name}
            value={value}
            onValueChange={setValue}
        >
            <ComboboxTrigger placeholder="Pick an account" disabled={disabled} />
            <ComboboxPopup>
                <ComboboxSearch />
                <ComboboxList<Account>
                    renderItem={(a) => (
                        <ComboboxItem item={a}>
                            <b>{a.name}</b> ({a.id})
                        </ComboboxItem>
                    )}
                >
                    <ComboboxEmpty>Nothing like that</ComboboxEmpty>
                </ComboboxList>
            </ComboboxPopup>
        </Combobox>
    );
}

function Multi({ onCreate = () => {} }: { onCreate?: (text: string) => void }) {
    const [value, setValue] = useState<string[]>(['sav']);
    return (
        <Combobox
            multiple
            items={ACCOUNTS}
            itemKey={(a) => a.id}
            itemText={(a) => a.name}
            value={value}
            onValueChange={setValue}
        >
            <ComboboxTrigger placeholder="None" />
            <ComboboxPopup>
                <ComboboxSearch />
                <ComboboxList>
                    <ComboboxCreate onCreate={onCreate} />
                </ComboboxList>
            </ComboboxPopup>
        </Combobox>
    );
}

const field = () => screen.getByRole('combobox');
const search = () => screen.getByRole('textbox', { name: 'Search options', hidden: true });
const option = (name: RegExp) => screen.getByRole('option', { name, hidden: true });

describe('Combobox', () => {
    it('is a focusable field that Enter opens, focusing the search', () => {
        render(<Single />);
        expect(field()).toHaveAttribute('tabindex', '0');
        expect(field()).toHaveTextContent('Pick an account');
        fireEvent.keyDown(field(), { key: 'Enter' });
        expect(field()).toHaveAttribute('aria-expanded', 'true');
        expect(search()).toHaveFocus();
    });

    it('arrow keys move through the matches, wrapping; Enter chooses and closes (single)', () => {
        render(<Single />);
        fireEvent.keyDown(field(), { key: 'ArrowDown' });
        fireEvent.keyDown(search(), { key: 'ArrowDown' });
        expect(search()).toHaveAttribute('aria-activedescendant', expect.stringMatching(/chk$/));
        fireEvent.keyDown(search(), { key: 'ArrowUp' });
        expect(search()).toHaveAttribute('aria-activedescendant', expect.stringMatching(/crd$/));
        fireEvent.keyDown(search(), { key: 'Enter' });
        expect(field()).toHaveTextContent('Credit card');
        expect(field()).toHaveAttribute('aria-expanded', 'false');
    });

    it('typing filters; no matches shows the empty row', () => {
        render(<Single />);
        fireEvent.keyDown(field(), { key: 'Enter' });
        fireEvent.change(search(), { target: { value: 'sav' } });
        expect(screen.getAllByRole('option', { hidden: true })).toHaveLength(1);
        fireEvent.change(search(), { target: { value: 'zzz' } });
        expect(screen.getByText('Nothing like that')).toBeInTheDocument();
    });

    it('renders your own item content, with any item shape', () => {
        render(<Single />);
        expect(option(/Checking \(chk\)/)).toBeInTheDocument();
    });

    it('multiple: choosing toggles and keeps the list open', () => {
        render(<Multi />);
        fireEvent.keyDown(field(), { key: 'Enter' });
        fireEvent.click(option(/Checking/));
        expect(option(/Checking/)).toHaveAttribute('aria-selected', 'true');
        expect(option(/Savings/)).toHaveAttribute('aria-selected', 'true');
        expect(field()).toHaveAttribute('aria-expanded', 'true');
        fireEvent.click(option(/Savings/));
        expect(option(/Savings/)).toHaveAttribute('aria-selected', 'false');
    });

    it('removing a chip does not open the list', () => {
        render(<Multi />);
        fireEvent.click(screen.getByRole('button', { name: 'Remove Savings', hidden: true }));
        expect(field()).toHaveAttribute('aria-expanded', 'false');
        expect(field()).toHaveTextContent('None');
    });

    it('Enter with no matches creates what was typed', () => {
        const onCreate = vi.fn();
        render(<Multi onCreate={onCreate} />);
        fireEvent.keyDown(field(), { key: 'Enter' });
        fireEvent.change(search(), { target: { value: 'Brokerage' } });
        expect(screen.getByRole('option', { name: 'Add Brokerage', hidden: true })).toBeInTheDocument();
        act(() => {
            fireEvent.keyDown(search(), { key: 'Enter' });
        });
        expect(onCreate).toHaveBeenCalledWith('Brokerage');
        expect(search()).toHaveValue('');
    });

    it('reopening starts with the whole list (the search is cleared on close)', () => {
        render(<Single />);
        fireEvent.keyDown(field(), { key: 'Enter' });
        fireEvent.change(search(), { target: { value: 'sav' } });
        fireEvent.keyDown(search(), { key: 'ArrowDown' });
        fireEvent.keyDown(search(), { key: 'Enter' });
        fireEvent.keyDown(field(), { key: 'Enter' });
        expect(search()).toHaveValue('');
        expect(screen.getAllByRole('option', { hidden: true })).toHaveLength(3);
    });

    it('a disabled field does not open', () => {
        render(<Single disabled />);
        expect(field()).toHaveAttribute('tabindex', '-1');
        fireEvent.click(field());
        fireEvent.keyDown(field(), { key: 'Enter' });
        expect(field()).toHaveAttribute('aria-expanded', 'false');
    });
});
