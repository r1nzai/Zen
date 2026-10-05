import { render, screen } from '@testing-library/react';

import Backdrop from '../backdrop';
import ProgressRing from '../progress-ring';
import Skeleton from '../skeleton';
import Spinner from '../spinner';
import Card, { CardHeader, CardTitle, Stat, StatRow } from './index';

describe('Card', () => {
    it('is a glass section; a CardHeader holds the title and an action', () => {
        const { container } = render(
            <Card>
                <CardHeader>
                    <CardTitle>Budget</CardTitle>
                    <button>Edit</button>
                </CardHeader>
                content
            </Card>,
        );
        expect(container.firstChild).toHaveClass('glass', 'glow-edge');
        expect(container.querySelector('header')).toHaveClass('justify-between');
        expect(screen.getByRole('heading', { name: 'Budget', level: 4 })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    });

    it('CardTitle asChild gives your own heading its look', () => {
        render(
            <CardTitle asChild>
                <h2 className="mine">Budget</h2>
            </CardTitle>,
        );
        const heading = screen.getByRole('heading', { name: 'Budget', level: 2 });
        expect(heading).toHaveClass('mine', 'font-semibold');
    });
});

describe('Stat', () => {
    it('shows a label and value, toned', () => {
        render(
            <StatRow>
                <Stat label="Net" value="$1,200" hint="this month" tone="positive" />
                <Stat label="Spent" value="$800" tone="negative" />
            </StatRow>,
        );
        expect(screen.getByText('$1,200')).toHaveClass('text-primary');
        expect(screen.getByText('$800')).toHaveClass('text-destructive');
        expect(screen.getByText('this month')).toBeInTheDocument();
    });

    it('shows its children under the figure', () => {
        render(
            <Stat label="Spent" value="$800" hint="this month">
                <svg data-testid="trend" />
            </Stat>,
        );
        expect(screen.getByText('this month').nextElementSibling).toBe(screen.getByTestId('trend'));
    });
});

describe('ProgressRing', () => {
    it('is a labelled progressbar, clamped to 0–100', () => {
        const { rerender } = render(<ProgressRing value={0.42} label="Savings" />);
        expect(screen.getByRole('progressbar', { name: 'Savings' })).toHaveAttribute('aria-valuenow', '42');
        rerender(<ProgressRing value={3} label="Savings" />);
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
        rerender(<ProgressRing value={-1} label="Savings" />);
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    });
});

describe('Spinner and Skeleton', () => {
    it('are hidden from assistive tech and take a className', () => {
        const { container } = render(
            <>
                <Spinner className="size-6" />
                <Skeleton className="h-4 w-20" />
            </>,
        );
        const [spinner, skeleton] = Array.from(container.children);
        expect(spinner).toHaveAttribute('aria-hidden');
        expect(spinner).toHaveClass('animate-spin', 'size-6');
        expect(skeleton).toHaveAttribute('aria-hidden');
        expect(skeleton).toHaveClass('zen__skeleton', 'h-4');
    });
});

describe('Backdrop', () => {
    it('draws dots without a contour image, contours with one', () => {
        const { container, rerender } = render(<Backdrop />);
        expect(container.querySelector('.zen-dots')).not.toBeNull();
        expect(container.querySelector('.zen-topo')).toBeNull();
        rerender(<Backdrop topoSrc="/topo.svg" />);
        expect(container.querySelector('.zen-topo')).not.toBeNull();
        expect((container.firstChild as HTMLElement).style.getPropertyValue('--zen-topo')).toBe('url("/topo.svg")');
    });

    it('lights glow edges near the pointer', () => {
        const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
            cb(0);
            return 1;
        });
        const { container } = render(
            <>
                <Backdrop />
                <Card>lit</Card>
            </>,
        );
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 10, clientY: 20 }));
        const card = container.querySelector<HTMLElement>('.glow-edge')!;
        expect(card.style.getPropertyValue('--gx')).toBe('10px');
        // The backdrop's own light is a small box moved to the pointer (only it repaints).
        const light = container.querySelector<HTMLElement>('.zen-light')!;
        expect([light.style.left, light.style.top]).toEqual(['10px', '20px']);
        raf.mockRestore();
    });
});
