import { act, fireEvent, render, screen } from '@testing-library/react';

import NavigationMenu, {
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuTrigger,
} from './index';

function Nav() {
    return (
        <NavigationMenu aria-label="Main">
            <NavigationMenuItem>
                <NavigationMenuLink href="#home" active>
                    Home
                </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
                <NavigationMenuTrigger>Plan</NavigationMenuTrigger>
                <NavigationMenuContent data-testid="plan">
                    <NavigationMenuLink href="#budgets" description="Limits by category">
                        Budgets
                    </NavigationMenuLink>
                </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
                <NavigationMenuTrigger>Reports</NavigationMenuTrigger>
                <NavigationMenuContent data-testid="reports">
                    <NavigationMenuLink href="#spending">Spending</NavigationMenuLink>
                </NavigationMenuContent>
            </NavigationMenuItem>
        </NavigationMenu>
    );
}

const label = (name: string) => screen.getByRole('button', { name });

describe('NavigationMenu', () => {
    it('is a named nav of a list; labels say what they open; the current page is marked', () => {
        render(<Nav />);
        const nav = screen.getByRole('navigation', { name: 'Main' });
        expect(nav.querySelector('ul > li')).toBeInTheDocument();
        expect(label('Plan')).toHaveAttribute('aria-expanded', 'false');
        expect(label('Plan')).toHaveAttribute('aria-controls', screen.getByTestId('plan').id);
        expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
        // Not menu roles: a disclosure of links.
        expect(screen.queryByRole('menu')).toBeNull();
    });

    it('a panel link shows its description under it', () => {
        render(<Nav />);
        const link = screen.getByRole('link', { name: /Budgets/, hidden: true });
        expect(link).toHaveTextContent('BudgetsLimits by category');
    });

    it('a click opens and closes it', () => {
        render(<Nav />);
        fireEvent.click(label('Plan'));
        expect(label('Plan')).toHaveAttribute('aria-expanded', 'true');
        fireEvent.click(label('Plan'));
        expect(label('Plan')).toHaveAttribute('aria-expanded', 'false');
    });

    it('opens after the pointer rests, at once while another is open, and a click keeps a hover-opened one', () => {
        vi.useFakeTimers();
        render(<Nav />);
        fireEvent.pointerEnter(label('Plan'), { pointerType: 'mouse' });
        act(() => {
            vi.advanceTimersByTime(140);
        });
        expect(label('Plan')).toHaveAttribute('aria-expanded', 'false');
        act(() => {
            vi.advanceTimersByTime(10);
        });
        expect(label('Plan')).toHaveAttribute('aria-expanded', 'true');
        fireEvent.click(label('Plan'));
        expect(label('Plan')).toHaveAttribute('aria-expanded', 'true');
        fireEvent.pointerEnter(label('Reports'), { pointerType: 'mouse' });
        expect(label('Reports')).toHaveAttribute('aria-expanded', 'true');
        vi.useRealTimers();
    });

    it('a pointer-opened panel closes once the pointer has left it a moment', () => {
        vi.useFakeTimers();
        render(<Nav />);
        fireEvent.pointerEnter(label('Plan'), { pointerType: 'mouse' });
        act(() => {
            vi.advanceTimersByTime(150);
        });
        fireEvent.pointerLeave(label('Plan'), { pointerType: 'mouse' });
        fireEvent.pointerEnter(screen.getByTestId('plan'), { pointerType: 'mouse' });
        act(() => {
            vi.advanceTimersByTime(300);
        });
        expect(label('Plan')).toHaveAttribute('aria-expanded', 'true');
        fireEvent.pointerLeave(screen.getByTestId('plan'), { pointerType: 'mouse' });
        act(() => {
            vi.advanceTimersByTime(200);
        });
        expect(label('Plan')).toHaveAttribute('aria-expanded', 'false');
        vi.useRealTimers();
    });

    it('Tab moving past the panel closes it', () => {
        render(<Nav />);
        fireEvent.click(label('Plan'));
        fireEvent.blur(label('Plan'), { relatedTarget: label('Reports') });
        expect(label('Plan')).toHaveAttribute('aria-expanded', 'false');
    });
});
