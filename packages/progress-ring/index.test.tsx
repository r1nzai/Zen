import { render, screen } from '@testing-library/react';
import ProgressRing from './index';

describe('ProgressRing', () => {
    it('is a labelled progressbar reporting a percentage', () => {
        render(<ProgressRing value={0.42} label="Savings goal" />);
        const bar = screen.getByRole('progressbar', { name: 'Savings goal' });
        expect(bar).toHaveAttribute('aria-valuemin', '0');
        expect(bar).toHaveAttribute('aria-valuemax', '100');
        expect(bar).toHaveAttribute('aria-valuenow', '42');
    });

    it('clamps values outside 0–1', () => {
        const { rerender } = render(<ProgressRing value={1.5} label="Goal" />);
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
        rerender(<ProgressRing value={-0.2} label="Goal" />);
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    });

    it('fills the arc in proportion to the value', () => {
        const { container } = render(<ProgressRing value={0.25} size={84} stroke={7} label="Goal" />);
        const arc = container.querySelectorAll('circle')[1];
        const c = Number(arc.getAttribute('stroke-dasharray'));
        expect(Number(arc.getAttribute('stroke-dashoffset'))).toBeCloseTo(c * 0.75);
    });

    it('renders its children in the middle', () => {
        render(
            <ProgressRing value={0.5} label="Goal">
                50%
            </ProgressRing>,
        );
        expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('sends out a burst when the goal is reached, not when it starts there', () => {
        const { container, rerender } = render(<ProgressRing value={1} label="Goal" />);
        expect(container.querySelector('.zen__ring-burst')).toBeNull();
        rerender(<ProgressRing value={0.5} label="Goal" />);
        expect(container.querySelector('.zen__ring-burst')).toBeNull();
        rerender(<ProgressRing value={1.2} label="Goal" />);
        expect(container.querySelector('.zen__ring-burst')).not.toBeNull();
    });
});
