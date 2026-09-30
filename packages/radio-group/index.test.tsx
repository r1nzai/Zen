import { fireEvent, render, screen } from '@testing-library/react';

import RadioGroup, { Radio } from './index';

function Repay({
    onChange = () => {},
    value = 'emi',
    disabled = false,
}: {
    onChange?: (v: string) => void;
    value?: string | null;
    disabled?: boolean;
}) {
    return (
        <RadioGroup label="Repay" value={value} onChange={onChange} disabled={disabled}>
            <Radio value="emi" description="Pay less each month.">
                Lower the EMI
            </Radio>
            <Radio value="tenure">Shorten the tenure</Radio>
            <Radio value="both" disabled>
                Both
            </Radio>
        </RadioGroup>
    );
}

describe('RadioGroup', () => {
    it('is a labelled group of native radios sharing a name, the chosen one checked', () => {
        render(<Repay />);
        expect(screen.getByRole('radiogroup', { name: 'Repay' })).toBeInTheDocument();
        const emi = screen.getByRole('radio', { name: /Lower the EMI/ });
        const tenure = screen.getByRole('radio', { name: 'Shorten the tenure' });
        expect(emi).toBeChecked();
        expect(tenure).not.toBeChecked();
        expect(emi.getAttribute('name')).toBe(tenure.getAttribute('name'));
    });

    it('choosing reports the value; disabled options and groups can’t be chosen', () => {
        const onChange = vi.fn();
        const { rerender } = render(<Repay onChange={onChange} value={null} />);
        fireEvent.click(screen.getByRole('radio', { name: 'Shorten the tenure' }));
        expect(onChange).toHaveBeenCalledWith('tenure');
        expect(screen.getByRole('radio', { name: 'Both' })).toBeDisabled();
        rerender(<Repay onChange={onChange} disabled />);
        expect(screen.getByRole('radio', { name: 'Shorten the tenure' })).toBeDisabled();
    });

    it('Radio must be inside RadioGroup', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => render(<Radio value="x">X</Radio>)).toThrow('<Radio> must be inside <RadioGroup>');
    });
});
