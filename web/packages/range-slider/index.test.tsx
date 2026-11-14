import { fireEvent, render, screen } from '@testing-library/react';

import RangeSlider from './index';

describe('RangeSlider', () => {
    const setup = () => {
        const onValueChange = vi.fn();
        const onValueCommit = vi.fn();
        render(
            <RangeSlider
                label="Amount"
                value={[20, 60]}
                onValueChange={onValueChange}
                onValueCommit={onValueCommit}
                valueText={(v) => `$${v}`}
            />,
        );
        return { onValueChange, onValueCommit };
    };

    it('is a labelled group of two named sliders', () => {
        setup();
        expect(screen.getByRole('group', { name: 'Amount' })).toBeInTheDocument();
        expect(screen.getByRole('slider', { name: 'Minimum' })).toHaveValue('20');
        expect(screen.getByRole('slider', { name: 'Maximum' })).toHaveAttribute('aria-valuetext', '$60');
    });

    it('moves either end, and the ends never cross', () => {
        const { onValueChange } = setup();
        fireEvent.change(screen.getByRole('slider', { name: 'Minimum' }), { target: { value: '35' } });
        expect(onValueChange).toHaveBeenLastCalledWith([35, 60]);
        fireEvent.change(screen.getByRole('slider', { name: 'Minimum' }), { target: { value: '80' } });
        expect(onValueChange).toHaveBeenLastCalledWith([60, 60]);
        fireEvent.change(screen.getByRole('slider', { name: 'Maximum' }), { target: { value: '10' } });
        expect(onValueChange).toHaveBeenLastCalledWith([20, 20]);
    });

    it('commits when let go', () => {
        const { onValueCommit } = setup();
        fireEvent.pointerUp(screen.getByRole('slider', { name: 'Maximum' }));
        expect(onValueCommit).toHaveBeenCalledWith([20, 60]);
    });
});
