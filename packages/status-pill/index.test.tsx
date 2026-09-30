import { fireEvent, render, screen } from '@testing-library/react';

import StatusPill, { StatusPillAction } from './index';

describe('StatusPill', () => {
    it('is a polite live status in its tone', () => {
        const { rerender } = render(<StatusPill>Saving…</StatusPill>);
        const pill = screen.getByRole('status');
        expect(pill).toHaveClass('text-muted-foreground');
        rerender(<StatusPill tone="positive">Saved</StatusPill>);
        expect(pill).toHaveClass('text-primary');
        rerender(<StatusPill tone="negative">Not saved</StatusPill>);
        expect(pill).toHaveClass('text-destructive');
    });

    it('fades back when quiet, whatever its tone', () => {
        render(
            <StatusPill tone="positive" quiet>
                Saved
            </StatusPill>,
        );
        const pill = screen.getByRole('status');
        expect(pill).toHaveClass('bg-transparent', 'text-muted-foreground');
        expect(pill).not.toHaveClass('text-primary');
    });

    it('holds an action', () => {
        const retry = vi.fn();
        render(
            <StatusPill tone="negative">
                Not saved <StatusPillAction onClick={retry}>Retry</StatusPillAction>
            </StatusPill>,
        );
        const button = screen.getByRole('button', { name: 'Retry' });
        expect(button).toHaveAttribute('type', 'button');
        fireEvent.click(button);
        expect(retry).toHaveBeenCalledOnce();
    });
});
