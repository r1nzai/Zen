import { render, screen, fireEvent } from '@testing-library/react';
import Badge from './index';

describe('Badge', () => {
    // ── element & children ──────────────────────────────────────────────────

    it('renders a <span> element', () => {
        const { container } = render(<Badge />);
        expect((container.firstChild as HTMLElement).tagName.toLowerCase()).toBe('span');
    });

    it('renders children inside the span', () => {
        render(<Badge>Beta</Badge>);
        expect(screen.getByText('Beta')).toBeInTheDocument();
    });

    // ── base class ──────────────────────────────────────────────────────────

    it('always applies the zen__badge base class', () => {
        const { container } = render(<Badge />);
        expect(container.firstChild).toHaveClass('zen__badge');
    });

    // ── variants ────────────────────────────────────────────────────────────

    it('default variant (no prop) applies bg-primary and text-primary-foreground', () => {
        const { container } = render(<Badge>Default</Badge>);
        const el = container.firstChild as HTMLElement;
        expect(el).toHaveClass('bg-primary');
        expect(el).toHaveClass('text-primary-foreground');
    });

    it('variant="default" applies bg-primary and text-primary-foreground', () => {
        const { container } = render(<Badge variant="default">Default</Badge>);
        const el = container.firstChild as HTMLElement;
        expect(el).toHaveClass('bg-primary');
        expect(el).toHaveClass('text-primary-foreground');
    });

    it('variant="secondary" applies bg-secondary and text-secondary-foreground', () => {
        const { container } = render(<Badge variant="secondary">Secondary</Badge>);
        const el = container.firstChild as HTMLElement;
        expect(el).toHaveClass('bg-secondary');
        expect(el).toHaveClass('text-secondary-foreground');
        expect(el).not.toHaveClass('bg-primary');
    });

    it('variant="destructive" applies bg-destructive and text-destructive-foreground', () => {
        const { container } = render(<Badge variant="destructive">Destructive</Badge>);
        const el = container.firstChild as HTMLElement;
        expect(el).toHaveClass('bg-destructive');
        expect(el).toHaveClass('text-destructive-foreground');
        expect(el).not.toHaveClass('bg-primary');
    });

    it('variant="outline" applies text-foreground without any bg override', () => {
        const { container } = render(<Badge variant="outline">Outline</Badge>);
        const el = container.firstChild as HTMLElement;
        expect(el).toHaveClass('text-foreground');
        // outline has no background colour — the bg-* classes from other variants
        // must be absent
        expect(el).not.toHaveClass('bg-primary');
        expect(el).not.toHaveClass('bg-secondary');
        expect(el).not.toHaveClass('bg-destructive');
    });

    // ── className forwarding ─────────────────────────────────────────────────

    it('merges a custom className alongside the zen__badge base class', () => {
        const { container } = render(<Badge className="my-custom-badge">Custom</Badge>);
        const el = container.firstChild as HTMLElement;
        expect(el).toHaveClass('zen__badge');
        expect(el).toHaveClass('my-custom-badge');
    });

    it('custom className does not remove the variant classes', () => {
        const { container } = render(
            <Badge variant="secondary" className="extra-class">
                Secondary + Extra
            </Badge>,
        );
        const el = container.firstChild as HTMLElement;
        expect(el).toHaveClass('bg-secondary');
        expect(el).toHaveClass('extra-class');
    });

    // ── fireEvent smoke test ─────────────────────────────────────────────────

    it('forwards arbitrary event handlers (onClick)', () => {
        const handleClick = vi.fn();
        render(<Badge onClick={handleClick}>Clickable</Badge>);
        fireEvent.click(screen.getByText('Clickable'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });
});
