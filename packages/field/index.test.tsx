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
        expect(field).toHaveAccessibleDescription('Pick one.');
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

describe('Field hint and error', () => {
    it('shows the error in place of the hint until it is fixed', () => {
        const { rerender } = render(
            <Field label="Amount" hint="In rupees." error="Enter an amount.">
                <Input />
            </Field>,
        );
        expect(screen.queryByText('In rupees.')).toBeNull();
        expect(screen.getByLabelText('Amount')).toHaveAccessibleDescription('Enter an amount.');
        rerender(
            <Field label="Amount" hint="In rupees.">
                <Input />
            </Field>,
        );
        expect(screen.getByLabelText('Amount')).toHaveAccessibleDescription('In rupees.');
    });

    it('htmlFor links a control inside other markup, and only that one', () => {
        render(
            <Field label="Tenure" hint="Up to 30 years." error="Too long." htmlFor="tenure">
                <div>
                    <Input id="tenure" />
                    <Select aria-label="Unit" value="years" onChange={() => {}}>
                        <SelectItem value="years">years</SelectItem>
                    </Select>
                </div>
            </Field>,
        );
        const tenure = screen.getByLabelText('Tenure');
        expect(tenure).toHaveAttribute('id', 'tenure');
        expect(tenure).toHaveAccessibleDescription('Too long.');
        expect(tenure).toHaveAttribute('aria-invalid', 'true');
        const unit = screen.getByRole('button', { name: 'Unit' });
        expect(unit).not.toHaveAttribute('aria-describedby');
        expect(unit).not.toHaveAttribute('aria-invalid');
    });

    it("doesn't repeat ids for a direct child that also reads the Field", () => {
        render(
            <Field label="Note" hint="Optional.">
                <Input aria-describedby="extra" />
            </Field>,
        );
        const ids = screen.getByLabelText('Note').getAttribute('aria-describedby')!.split(' ');
        expect(new Set(ids).size).toBe(ids.length);
        expect(ids).toContain('extra');
    });
});
