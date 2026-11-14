import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';

import Keypad from './index';

function Typing({ decimals }: { decimals?: number }) {
    const [value, setValue] = useState('');
    return (
        <>
            <output>{value}</output>
            <Keypad value={value} onValueChange={setValue} decimals={decimals} />
        </>
    );
}
const press = (...keys: string[]) =>
    keys.forEach((k) => fireEvent.click(screen.getByRole('button', { name: k === 'back' ? 'Delete' : k })));
const typed = () => screen.getByRole('status').textContent;

describe('Keypad', () => {
    it('types an amount: no leading zeros, one point, two decimals', () => {
        render(<Typing />);
        press('0', '0', '4', '.', '5', '.', '0', '9');
        expect(typed()).toBe('4.50');
    });

    it('a point first starts at zero, and Delete takes the last character', () => {
        render(<Typing />);
        press('.', '5', 'back');
        expect(typed()).toBe('0.');
    });

    it('with no decimals, has no point', () => {
        render(<Typing decimals={0} />);
        expect(screen.getByRole('button', { name: '.' })).toBeDisabled();
    });

    it('is a labelled group', () => {
        render(<Typing />);
        expect(screen.getByRole('group', { name: 'Keypad' })).toBeInTheDocument();
    });
});
