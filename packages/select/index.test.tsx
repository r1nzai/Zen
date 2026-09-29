import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';

import { renderToString } from 'react-dom/server';

import Select, { SelectGroup, SelectItem, SelectOption, SelectSeparator } from './index';

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

    describe('SelectItem, SelectGroup, SelectSeparator', () => {
        const Currencies = ({
            value = 'usd',
            onChange = () => {},
        }: {
            value?: string;
            onChange?: (v: string) => void;
        }) => (
            <Select aria-label="Currency" value={value} onChange={onChange}>
                <SelectGroup label="Popular">
                    <SelectItem value="usd">US dollar</SelectItem>
                    <SelectItem value="eur" label="Euro">
                        <span>€</span> Euro
                    </SelectItem>
                </SelectGroup>
                <SelectSeparator />
                <SelectGroup label="Other">
                    <SelectItem value="jpy" disabled>
                        Japanese yen
                    </SelectItem>
                    <SelectItem value="inr">Indian rupee</SelectItem>
                </SelectGroup>
            </Select>
        );

        it('shows the chosen item in the field, also in server HTML', () => {
            expect(renderToString(<Currencies value="eur" />)).toContain('Euro');
            render(<Currencies value="inr" />);
            expect(screen.getByRole('button', { name: 'Currency' })).toHaveTextContent('Indian rupee');
        });

        it('groups are labelled, separators are not options', () => {
            render(<Currencies />);
            expect(screen.getAllByRole('group', { hidden: true }).map((g) => g.getAttribute('aria-label'))).toEqual([
                'Popular',
                'Other',
            ]);
            expect(screen.getAllByRole('option', { hidden: true })).toHaveLength(4);
            expect(screen.getByRole('separator', { hidden: true })).toBeInTheDocument();
        });

        it('arrow keys cross groups and skip disabled items; Enter chooses', () => {
            const onChange = vi.fn();
            render(<Currencies value="eur" onChange={onChange} />);
            const list = screen.getByRole('listbox', { hidden: true });
            fireEvent.keyDown(screen.getByRole('button', { name: 'Currency' }), { key: 'ArrowDown' });
            fireEvent.keyDown(list, { key: 'ArrowDown' }); // from Euro: yen is disabled, so Indian rupee
            expect(list).toHaveAttribute('aria-activedescendant', expect.stringMatching(/inr$/));
            fireEvent.keyDown(list, { key: 'Enter' });
            expect(onChange).toHaveBeenCalledWith('inr');
        });

        it('typing jumps to a matching item', () => {
            render(<Currencies />);
            const list = screen.getByRole('listbox', { hidden: true });
            fireEvent.keyDown(list, { key: 'i' });
            expect(list).toHaveAttribute('aria-activedescendant', expect.stringMatching(/inr$/));
        });

        it('items inside your own components report their text once mounted', () => {
            const Wrapped = ({ value, children }: { value: string; children: string }) => (
                <SelectItem value={value}>{children}</SelectItem>
            );
            render(
                <Select aria-label="Size" value="m" onChange={() => {}}>
                    <Wrapped value="s">Small</Wrapped>
                    <Wrapped value="m">Medium</Wrapped>
                </Select>,
            );
            expect(screen.getByRole('button', { name: 'Size' })).toHaveTextContent('Medium');
        });
    });
});
