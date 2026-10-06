import { render, screen } from '@testing-library/react';

import Meter from './index';

describe('Meter', () => {
    it('is a labelled meter with a spoken value', () => {
        render(
            <Meter
                label="Groceries"
                value={8200}
                max={10000}
                detail="₹8,200 / ₹10,000"
                valueText="₹8,200 of ₹10,000"
            />,
        );
        const meter = screen.getByRole('meter', { name: 'Groceries' });
        expect(meter).toHaveAttribute('aria-valuenow', '8200');
        expect(meter).toHaveAttribute('aria-valuemax', '10000');
        expect(meter).toHaveAttribute('aria-valuetext', '₹8,200 of ₹10,000');
    });

    it('fills to the ratio, and turns warm near the limit and red past it', () => {
        const bar = (c: HTMLElement) => c.querySelector<HTMLElement>('[style]')!;
        const { container, rerender } = render(<Meter value={50} />);
        expect(bar(container)).toHaveStyle({ width: '50%' });
        expect(bar(container)).toHaveClass('from-primary');
        rerender(<Meter value={90} />);
        expect(bar(container)).toHaveClass('bg-accent-foreground');
        rerender(<Meter value={130} hint="30 over" />);
        expect(bar(container)).toHaveStyle({ width: '100%' });
        expect(bar(container)).toHaveClass('bg-destructive');
        expect(screen.getByText('30 over')).toHaveClass('text-destructive');
    });

    it('takes a fixed tone', () => {
        const { container } = render(<Meter value={10} tone="danger" />);
        expect(container.querySelector('[style]')).toHaveClass('bg-destructive');
    });

    it('takes its element’s props, e.g. a name without a visible label', () => {
        render(<Meter value={3} max={10} aria-label="Cockpit share" data-testid="m" />);
        expect(screen.getByRole('meter', { name: 'Cockpit share' })).toHaveAttribute('data-testid', 'm');
    });
});

describe('Meter marks', () => {
    it('places each milestone along the bar, and marks those reached', () => {
        const { container } = render(<Meter label="Saved" value={6000} max={10000} marks={[2500, 5000, 7500]} />);
        const marks = [...container.querySelectorAll<HTMLElement>('.zen__meter-mark')];
        expect(marks.map((m) => m.style.left)).toEqual(['25%', '50%', '75%']);
        expect(marks.map((m) => m.hasAttribute('data-reached'))).toEqual([true, true, false]);
        expect(marks.every((m) => m.getAttribute('aria-hidden') === 'true')).toBe(true);
    });
});
