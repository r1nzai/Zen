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
});
