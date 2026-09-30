import { fireEvent, render, screen } from '@testing-library/react';

import Chip from './index';

describe('Chip', () => {
    it('is a button that shows whether it is pressed', () => {
        const onClick = vi.fn();
        const { rerender } = render(<Chip onClick={onClick}>5 yrs</Chip>);
        const chip = screen.getByRole('button', { name: '5 yrs' });
        expect(chip).toHaveAttribute('type', 'button');
        expect(chip).not.toHaveAttribute('aria-pressed');
        fireEvent.click(chip);
        expect(onClick).toHaveBeenCalled();
        rerender(<Chip pressed>5 yrs</Chip>);
        expect(chip).toHaveAttribute('aria-pressed', 'true');
    });
});
