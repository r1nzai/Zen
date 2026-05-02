import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './index';

describe('Button', () => {
    // ── element & children ──────────────────────────────────────────────────

    it('renders a <button> element', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders children inside the button', () => {
        render(<Button>Submit</Button>);
        expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    // ── click handling ──────────────────────────────────────────────────────

    it('fires the onClick handler when clicked', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click</Button>);
        fireEvent.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('has the disabled attribute when the disabled prop is set', () => {
        render(<Button disabled>Disabled</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('does not fire onClick when the button is disabled', async () => {
        const user = userEvent.setup();
        const handleClick = vi.fn();
        render(
            <Button disabled onClick={handleClick}>
                Disabled
            </Button>,
        );
        await user.click(screen.getByRole('button'));
        expect(handleClick).not.toHaveBeenCalled();
    });

    // ── variant prop ────────────────────────────────────────────────────────

    describe('variant prop', () => {
        it('default variant (no prop) applies bg-primary', () => {
            render(<Button>Default</Button>);
            expect(screen.getByRole('button')).toHaveClass('bg-primary');
        });

        it('variant="default" applies bg-primary and text-primary-foreground', () => {
            render(<Button variant="default">Default</Button>);
            const btn = screen.getByRole('button');
            expect(btn).toHaveClass('bg-primary');
            expect(btn).toHaveClass('text-primary-foreground');
        });

        it('variant="destructive" applies bg-destructive and text-destructive-foreground', () => {
            render(<Button variant="destructive">Destructive</Button>);
            const btn = screen.getByRole('button');
            expect(btn).toHaveClass('bg-destructive');
            expect(btn).toHaveClass('text-destructive-foreground');
            expect(btn).not.toHaveClass('bg-primary');
        });

        it('variant="outline" applies border-input and bg-background', () => {
            render(<Button variant="outline">Outline</Button>);
            const btn = screen.getByRole('button');
            expect(btn).toHaveClass('border-input');
            expect(btn).toHaveClass('bg-background');
            expect(btn).not.toHaveClass('bg-primary');
        });

        it('variant="secondary" applies bg-secondary and text-secondary-foreground', () => {
            render(<Button variant="secondary">Secondary</Button>);
            const btn = screen.getByRole('button');
            expect(btn).toHaveClass('bg-secondary');
            expect(btn).toHaveClass('text-secondary-foreground');
            expect(btn).not.toHaveClass('bg-primary');
        });

        it('variant="ghost" applies hover:bg-accent without any solid background class', () => {
            render(<Button variant="ghost">Ghost</Button>);
            const btn = screen.getByRole('button');
            // Ghost has hover states but no solid background or border
            expect(btn).toHaveClass('hover:bg-accent');
            expect(btn).not.toHaveClass('bg-primary');
            expect(btn).not.toHaveClass('bg-secondary');
            expect(btn).not.toHaveClass('bg-destructive');
            expect(btn).not.toHaveClass('border-input');
        });

        it('variant="link" applies underline-offset-4 and text-primary', () => {
            render(<Button variant="link">Link</Button>);
            const btn = screen.getByRole('button');
            expect(btn).toHaveClass('underline-offset-4');
            expect(btn).toHaveClass('text-primary');
            expect(btn).not.toHaveClass('bg-primary');
        });

        it('variant="icon" renders with only the base zen__button class (no variant colour)', () => {
            render(<Button variant="icon">Icon</Button>);
            const btn = screen.getByRole('button');
            expect(btn).toHaveClass('zen__button');
            expect(btn).not.toHaveClass('bg-primary');
            expect(btn).not.toHaveClass('bg-secondary');
            expect(btn).not.toHaveClass('bg-destructive');
        });
    });

    // ── size prop ────────────────────────────────────────────────────────────

    describe('size prop', () => {
        it('default size (no prop) applies h-9', () => {
            render(<Button>Default size</Button>);
            expect(screen.getByRole('button')).toHaveClass('h-9');
        });

        it('size="sm" applies h-8 and text-xs', () => {
            render(<Button size="sm">Small</Button>);
            const btn = screen.getByRole('button');
            expect(btn).toHaveClass('h-8');
            expect(btn).toHaveClass('text-xs');
        });

        it('size="lg" applies h-10 and px-8', () => {
            render(<Button size="lg">Large</Button>);
            const btn = screen.getByRole('button');
            expect(btn).toHaveClass('h-10');
            expect(btn).toHaveClass('px-8');
        });
    });

    // ── className forwarding ─────────────────────────────────────────────────

    it('merges a custom className alongside the base zen__button class', () => {
        render(<Button className="my-btn">Custom</Button>);
        const btn = screen.getByRole('button');
        expect(btn).toHaveClass('zen__button');
        expect(btn).toHaveClass('my-btn');
    });

    it('custom className does not remove variant classes', () => {
        render(
            <Button variant="destructive" className="extra">
                Destructive + Extra
            </Button>,
        );
        const btn = screen.getByRole('button');
        expect(btn).toHaveClass('bg-destructive');
        expect(btn).toHaveClass('extra');
    });
});
