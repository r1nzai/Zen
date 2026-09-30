import { render, screen } from '@testing-library/react';

import Alert from './index';

describe('Alert', () => {
    it('announces bad news at once and anything else politely; role can be changed', () => {
        const { rerender } = render(<Alert tone="negative">Not saved.</Alert>);
        expect(screen.getByRole('alert')).toHaveTextContent('Not saved.');
        rerender(<Alert tone="positive">Saved.</Alert>);
        expect(screen.getByRole('status')).toHaveTextContent('Saved.');
        rerender(<Alert role="note">Set in Loans.</Alert>);
        expect(screen.getByRole('note')).toHaveTextContent('Set in Loans.');
    });

    it('is a tinted box, or with `plain` just coloured text; className wins', () => {
        const { rerender } = render(<Alert tone="negative">x</Alert>);
        expect(screen.getByRole('alert')).toHaveClass(
            'rounded-lg',
            'border',
            'border-destructive/35',
            'bg-destructive/10',
        );
        rerender(
            <Alert tone="negative" plain className="text-xs">
                x
            </Alert>,
        );
        expect(screen.getByRole('alert')).toHaveClass('text-destructive', 'text-xs');
        expect(screen.getByRole('alert')).not.toHaveClass('border', 'text-sm');
    });

    it("shows the tone's icon, your own, or none", () => {
        const { container, rerender } = render(<Alert>x</Alert>);
        expect(container.querySelectorAll('svg')).toHaveLength(1);
        rerender(<Alert icon={<b data-testid="mine" />}>x</Alert>);
        expect(screen.getByTestId('mine')).toBeInTheDocument();
        rerender(<Alert icon={null}>x</Alert>);
        expect(container.querySelector('svg')).toBeNull();
    });

    it('a title leads; the text under it is quieter', () => {
        render(
            <Alert tone="negative" title="Deleted for good.">
                Nobody can open it.
            </Alert>,
        );
        expect(screen.getByText('Deleted for good.').tagName).toBe('P');
        expect(screen.getByText('Nobody can open it.')).toHaveClass('text-muted-foreground');
    });
});
