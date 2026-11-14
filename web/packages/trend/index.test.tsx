import { render, screen } from '@testing-library/react';

import Trend from './index';

describe('Trend', () => {
    it('shows the change as a signed percent', () => {
        render(<Trend value={0.12} locale="en-US" />);
        expect(screen.getByText('+12%')).toHaveAttribute('data-direction', 'up');
    });

    it('colours by whether the direction is good news', () => {
        render(
            <>
                <Trend value={0.12} good="down" locale="en-US" />
                <Trend value={-0.05} good="down" locale="en-US" />
                <Trend value={0} locale="en-US" />
            </>,
        );
        expect(screen.getByText('+12%')).toHaveClass('text-destructive');
        expect(screen.getByText('-5%')).toHaveClass('text-primary');
        expect(screen.getByText('0%')).toHaveAttribute('data-direction', 'flat');
    });

    it('takes its own format, and a muted note after', () => {
        render(
            <Trend value={4200} format={(v) => `+$${v / 100}`}>
                vs last month
            </Trend>,
        );
        expect(screen.getByText('+$42')).toBeInTheDocument();
        expect(screen.getByText('vs last month')).toHaveClass('text-muted-foreground');
    });
});
