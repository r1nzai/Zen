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

    it('default variant (no prop) applies the accent glow chip', () => {
        const { container } = render(<Badge>Default</Badge>);
        const el = container.firstChild as HTMLElement;
        expect(el).toHaveClass('bg-glow/10');
        expect(el).toHaveClass('text-primary');
    });

    it('variant="default" applies the accent glow chip', () => {
        const { container } = render(<Badge variant="default">Default</Badge>);
        const el = container.firstChild as HTMLElement;
        expect(el).toHaveClass('bg-glow/10');
        expect(el).toHaveClass('text-primary');
    });

    it('variant="secondary" applies a neutral tint', () => {
        const { container } = render(<Badge variant="secondary">Secondary</Badge>);
        const el = container.firstChild as HTMLElement;
        expect(el).toHaveClass('bg-tint/[0.06]');
        expect(el).toHaveClass('text-foreground');
        expect(el).not.toHaveClass('bg-glow/10');
    });

    it('variant="destructive" applies a destructive tint', () => {
        const { container } = render(<Badge variant="destructive">Destructive</Badge>);
        const el = container.firstChild as HTMLElement;
        expect(el).toHaveClass('bg-destructive/10');
        expect(el).toHaveClass('text-destructive');
        expect(el).not.toHaveClass('bg-glow/10');
    });

    it('variant="outline" applies text-foreground without any bg override', () => {
        const { container } = render(<Badge variant="outline">Outline</Badge>);
        const el = container.firstChild as HTMLElement;
        expect(el).toHaveClass('text-foreground');
        // outline has no background colour — the bg-* classes from other variants
        // must be absent
        expect(el).not.toHaveClass('bg-glow/10');
        expect(el).not.toHaveClass('bg-tint/[0.06]');
        expect(el).not.toHaveClass('bg-destructive/10');
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
        expect(el).toHaveClass('bg-tint/[0.06]');
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
