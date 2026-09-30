import { render, screen } from '@testing-library/react';

import Inset from './index';

describe('Inset', () => {
    it('is a small tile by default, a bordered panel with `bordered`', () => {
        const { rerender } = render(<Inset data-testid="x">figure</Inset>);
        expect(screen.getByTestId('x')).toHaveClass('rounded-lg', 'bg-tint/[0.03]', 'px-3');
        expect(screen.getByTestId('x')).not.toHaveClass('border');
        rerender(
            <Inset data-testid="x" bordered>
                note
            </Inset>,
        );
        expect(screen.getByTestId('x')).toHaveClass('rounded-xl', 'border', 'border-tint/[0.08]', 'p-4');
    });

    it('tints for good and bad news', () => {
        const { rerender } = render(<Inset data-testid="x" tone="positive" />);
        expect(screen.getByTestId('x')).toHaveClass('bg-primary/10');
        rerender(<Inset data-testid="x" bordered tone="negative" />);
        expect(screen.getByTestId('x')).toHaveClass('border-destructive/35', 'bg-destructive/[0.08]');
    });

    it('asChild puts the look on your element; className wins', () => {
        render(
            <Inset asChild className="px-5">
                <p>text</p>
            </Inset>,
        );
        const p = screen.getByText('text');
        expect(p.tagName).toBe('P');
        expect(p).toHaveClass('px-5', 'rounded-lg');
        expect(p).not.toHaveClass('px-3');
    });
});
