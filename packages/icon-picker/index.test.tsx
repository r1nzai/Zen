import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';

import IconPicker from './index';

const ICONS = [
    { value: 'cart', label: 'Groceries', icon: '🛒' },
    { value: 'train', label: 'Transport', icon: '🚆' },
];

function Picker({ onChange = () => {} }: { onChange?: (v: { icon: string; color?: string }) => void }) {
    const [value, setValue] = useState<{ icon: string; color?: string }>({ icon: 'cart', color: 'blue' });
    return (
        <IconPicker
            label="Category icon"
            icons={ICONS}
            value={value}
            onChange={(v) => {
                setValue(v);
                onChange(v);
            }}
        />
    );
}

describe('IconPicker', () => {
    it('names the current choice on its button, and shows the icon', () => {
        render(<Picker />);
        const button = screen.getByRole('button', { name: 'Category icon: Groceries, Blue' });
        expect(button).toHaveTextContent('🛒');
        expect(button).toHaveAttribute('aria-haspopup', 'dialog');
    });

    it('picks an icon and a colour as two radio groups', () => {
        const onChange = vi.fn();
        render(<Picker onChange={onChange} />);
        fireEvent.click(screen.getByRole('radio', { name: 'Transport', hidden: true }));
        expect(onChange).toHaveBeenLastCalledWith({ icon: 'train', color: 'blue' });
        fireEvent.click(screen.getByRole('radio', { name: 'Teal', hidden: true }));
        expect(onChange).toHaveBeenLastCalledWith({ icon: 'train', color: 'teal' });
        expect(screen.getByRole('radio', { name: 'Teal', hidden: true })).toBeChecked();
        expect(screen.getByRole('button', { name: 'Category icon: Transport, Teal' })).toHaveTextContent('🚆');
    });
});
