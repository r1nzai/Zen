import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';

import Select, { SelectOption } from './index';

const OPTIONS: SelectOption<string>[] = [
    { value: 'inr', label: 'Indian rupee' },
    { value: 'usd', label: 'US dollar' },
    { value: 'eur', label: 'Euro', disabled: true },
    { value: 'gbp', label: 'British pound' },
];

function Controlled({ onValue }: { onValue?: (v: string) => void }) {
    const [value, setValue] = useState<string | null>('usd');
    return (
        <Select
            aria-label="Currency"
            name="currency"
            value={value}
            options={OPTIONS}
            onChange={(v) => {
                setValue(v);
                onValue?.(v);
            }}
        />
    );
}

const trigger = () => screen.getByRole('button', { name: 'Currency' });
const listbox = () => screen.getByRole('listbox', { hidden: true });
const option = (name: string) => screen.getByRole('option', { name, hidden: true });

describe('Select', () => {
    it('shows the chosen label on a listbox trigger, with a hidden form value', () => {
        const { container } = render(<Controlled />);
        expect(trigger()).toHaveTextContent('US dollar');
        expect(trigger()).toHaveAttribute('aria-haspopup', 'listbox');
        expect(trigger()).toHaveAttribute('aria-expanded', 'false');
        expect(container.querySelector('input[type=hidden]')).toHaveAttribute('value', 'usd');
        expect(option('US dollar')).toHaveAttribute('aria-selected', 'true');
    });

    it('opens from the keyboard on the chosen option, and arrows skip disabled ones', () => {
        render(<Controlled />);
        fireEvent.keyDown(trigger(), { key: 'ArrowDown' });
        expect(trigger()).toHaveAttribute('aria-expanded', 'true');
        expect(listbox()).toHaveFocus();
        expect(listbox()).toHaveAttribute('aria-activedescendant', option('US dollar').id);
        fireEvent.keyDown(listbox(), { key: 'ArrowDown' });
        expect(listbox()).toHaveAttribute('aria-activedescendant', option('British pound').id); // Euro is disabled
        fireEvent.keyDown(listbox(), { key: 'Home' });
        expect(listbox()).toHaveAttribute('aria-activedescendant', option('Indian rupee').id);
    });

    it('chooses with Enter and closes', () => {
        const onValue = vi.fn();
        render(<Controlled onValue={onValue} />);
        fireEvent.keyDown(trigger(), { key: 'ArrowDown' });
        fireEvent.keyDown(listbox(), { key: 'End' });
        fireEvent.keyDown(listbox(), { key: 'Enter' });
        expect(onValue).toHaveBeenCalledWith('gbp');
        expect(trigger()).toHaveTextContent('British pound');
        expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    });

    it('jumps to an option by typing its start', () => {
        render(<Controlled />);
        fireEvent.keyDown(trigger(), { key: 'ArrowDown' });
        fireEvent.keyDown(listbox(), { key: 'b' });
        expect(listbox()).toHaveAttribute('aria-activedescendant', option('British pound').id);
    });

    it('chooses on click, but not a disabled option', () => {
        const onValue = vi.fn();
        render(<Controlled onValue={onValue} />);
        fireEvent.click(option('Euro'));
        expect(onValue).not.toHaveBeenCalled();
        act(() => fireEvent.click(option('Indian rupee')));
        expect(onValue).toHaveBeenCalledWith('inr');
    });

    it('shows the placeholder when nothing is chosen', () => {
        render(
            <Select aria-label="Currency" value={null} options={OPTIONS} onChange={() => {}} placeholder="Pick one" />,
        );
        expect(trigger()).toHaveTextContent('Pick one');
    });
});
