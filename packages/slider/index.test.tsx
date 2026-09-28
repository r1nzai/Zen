import { fireEvent, render, screen } from '@testing-library/react';

import Slider from './index';

describe('Slider', () => {
    it('is a native range with a spoken value, filled to the value', () => {
        render(
            <Slider
                aria-label="Hue"
                value={90}
                min={0}
                max={359}
                valueText={(v) => `Hue ${v} degrees`}
                onValueChange={() => {}}
            />,
        );
        const slider = screen.getByRole('slider', { name: 'Hue' });
        expect(slider).toHaveAttribute('aria-valuetext', 'Hue 90 degrees');
        expect(slider.style.getPropertyValue('--zen-track')).toContain('25.069');
    });

    it('reports while dragging and on release', () => {
        const onValueChange = vi.fn();
        const onValueCommit = vi.fn();
        render(<Slider aria-label="Glow" value={50} onValueChange={onValueChange} onValueCommit={onValueCommit} />);
        const slider = screen.getByRole('slider');
        fireEvent.input(slider, { target: { value: '60' } });
        expect(onValueChange).toHaveBeenCalledWith(60);
        fireEvent.change(slider, { target: { value: '70' } });
        expect(onValueCommit).toHaveBeenCalledWith(70);
    });

    it('takes a custom track and thumb', () => {
        render(<Slider aria-label="x" value={1} trackBackground="red" thumbColor="blue" onValueChange={() => {}} />);
        const slider = screen.getByRole('slider');
        expect(slider.style.getPropertyValue('--zen-track')).toBe('red');
        expect(slider.style.getPropertyValue('--zen-thumb')).toBe('blue');
    });
});
