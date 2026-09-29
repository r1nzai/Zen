import { render, screen } from '@testing-library/react';

import Backdrop from '../backdrop';
import ProgressRing from '../progress-ring';
import Skeleton from '../skeleton';
import Spinner from '../spinner';
import Card, { Stat, StatRow } from './index';

describe('Card', () => {
    it('renders a glass section with an optional header', () => {
        const { container } = render(
            <Card title="Budget" action={<button>Edit</button>}>
                content
            </Card>,
        );
        expect(container.firstChild).toHaveClass('glass', 'glow-edge');
        expect(screen.getByRole('heading', { name: 'Budget' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    });

    it('has no header without a title or action', () => {
        const { container } = render(<Card>content</Card>);
        expect(container.querySelector('header')).toBeNull();
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
