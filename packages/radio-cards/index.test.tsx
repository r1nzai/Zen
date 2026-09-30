import { fireEvent, render, screen } from '@testing-library/react';

import RadioCards, { RadioCard } from './index';

function Palette({ onChange = () => {}, value = 'violet' }: { onChange?: (v: string) => void; value?: string }) {
    return (
        <RadioCards label="Palette" value={value} onChange={onChange} className="grid">
            <RadioCard value="violet">Violet</RadioCard>
            <RadioCard value="ocean">Ocean</RadioCard>
            <RadioCard value="custom" disabled>
                Custom
            </RadioCard>
        </RadioCards>
    );
}

describe('RadioCards', () => {
    it('is a labelled radio group of cards, the chosen one checked', () => {
        render(<Palette />);
        expect(screen.getByRole('radiogroup', { name: 'Palette' })).toHaveClass('grid');
        expect(screen.getByRole('radio', { name: 'Violet' })).toBeChecked();
        expect(screen.getByRole('radio', { name: 'Ocean' })).not.toBeChecked();
    });

    it('choosing a card reports its value; a disabled card cannot be chosen', () => {
        const onChange = vi.fn();
        render(<Palette onChange={onChange} />);
        fireEvent.click(screen.getByRole('radio', { name: 'Ocean' }));
        expect(onChange).toHaveBeenCalledWith('ocean');
        expect(screen.getByRole('radio', { name: 'Custom' })).toBeDisabled();
    });

    it('the whole card is the click target', () => {
        render(<Palette />);
        const input = screen.getByRole('radio', { name: 'Ocean' });
        expect(input).toHaveClass('absolute', 'inset-0', 'size-full');
        expect(input.closest('label')).toHaveClass('zen__radio-card', 'relative');
    });
});
