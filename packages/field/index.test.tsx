import { render, screen } from '@testing-library/react';

import Combobox, { ComboboxList, ComboboxPopup, ComboboxTrigger } from '../combobox';
import Input from '../input';
import MonthPicker from '../month-picker';
import Select, { SelectItem } from '../select';
import Field, { FormMessage } from './index';

describe('Field', () => {
    it('labels the control and links its hint', () => {
        render(
            <Field label="Email" hint="We never share it.">
                <Input type="email" />
            </Field>,
        );
        const input = screen.getByLabelText('Email');
        expect(input).toHaveAccessibleDescription('We never share it.');
        expect(input).not.toHaveAttribute('aria-invalid');
    });

    it('shows an error, marks the control invalid, and keeps its own id', () => {
        render(
            <Field label="Amount" error="Enter an amount.">
                <Input id="amount" />
            </Field>,
        );
        const input = screen.getByLabelText('Amount');
        expect(input).toHaveAttribute('id', 'amount');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveAccessibleDescription('Enter an amount.');
        expect(screen.getByRole('alert')).toHaveTextContent('Enter an amount.');
    });
});

describe('FormMessage', () => {
    it('uses an alert for errors and a status otherwise', () => {
        const { rerender } = render(<FormMessage tone="error">Wrong password.</FormMessage>);
        expect(screen.getByRole('alert')).toHaveTextContent('Wrong password.');
        rerender(<FormMessage>Check your email.</FormMessage>);
        expect(screen.getByRole('status')).toHaveTextContent('Check your email.');
    });
});

describe('Field with Zen controls', () => {
    it('wires a Select: label, hint, error', () => {
        render(
            <Field label="Currency" hint="Used for every amount." error="Pick one.">
                <Select value={null} onChange={() => {}}>
                    <SelectItem value="inr">INR</SelectItem>
                </Select>
            </Field>,
        );
        const field = screen.getByRole('button', { name: 'Currency' });
        expect(field).toHaveAccessibleDescription('Used for every amount. Pick one.');
        expect(field).toHaveAttribute('aria-invalid', 'true');
    });

    it('wires a MonthPicker', () => {
        render(
            <Field label="Start" hint="The first month it counts.">
                <MonthPicker value={null} onChange={() => {}} locale="en-IN" />
            </Field>,
        );
        expect(screen.getByRole('button', { name: 'Start' })).toHaveAccessibleDescription('The first month it counts.');
    });

    it('wires a Combobox, whose field is nested in it', () => {
        render(
            <Field label="Account" error="Choose an account.">
                <Combobox
                    items={['Checking']}
                    itemKey={(a) => a}
                    itemText={(a) => a}
                    value={null}
                    onValueChange={() => {}}
                >
                    <ComboboxTrigger placeholder="Pick" />
                    <ComboboxPopup>
                        <ComboboxList />
                    </ComboboxPopup>
                </Combobox>
            </Field>,
        );
        const field = screen.getByRole('combobox', { name: 'Account' });
        expect(field).toHaveAccessibleDescription('Choose an account.');
        expect(field).toHaveAttribute('aria-invalid', 'true');
    });
});
