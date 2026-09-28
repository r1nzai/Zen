import { fireEvent, render, screen } from '@testing-library/react';

import Segmented from './index';

const options = [
    { value: 'off', label: 'Off' },
    { value: 'soft', label: 'Soft' },
    { value: 'bright', label: 'Bright' },
] as const;

describe('Segmented', () => {
    it('is a labelled radio group with the value checked', () => {
        render(<Segmented label="Glow" value="soft" options={options} onChange={() => {}} />);
        expect(screen.getByRole('radiogroup', { name: 'Glow' })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: 'Soft' })).toBeChecked();
        expect(screen.getByRole('radio', { name: 'Off' })).not.toBeChecked();
    });

    it('reports the picked value', () => {
        const onChange = vi.fn();
        render(<Segmented label="Glow" value="soft" options={options} onChange={onChange} />);
        fireEvent.click(screen.getByRole('radio', { name: 'Bright' }));
        expect(onChange).toHaveBeenCalledWith('bright');
    });

    it('groups its radios under one name', () => {
        render(<Segmented label="Glow" name="glow" value="off" options={options} onChange={() => {}} />);
        for (const radio of screen.getAllByRole('radio')) expect(radio).toHaveAttribute('name', 'glow');
    });
});
