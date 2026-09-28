import { render, screen } from '@testing-library/react';

import Input from '../input';
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
