import { fireEvent, render, screen } from '@testing-library/react';

import Menu, { MenuHeader, MenuItem, MenuSeparator } from './index';

const Icon = () => <svg data-testid="icon" className="size-4" />;

function Account({ onSettings = () => {}, onLogout = () => {} }: { onSettings?: () => void; onLogout?: () => void }) {
    return (
        <Menu label="Account menu" trigger={<span>R</span>} triggerClassName="rounded-full" className="w-64">
            <MenuHeader>Signed in as r@example.com</MenuHeader>
            <MenuSeparator />
            <MenuItem icon={<Icon />} onSelect={onSettings}>
                Settings
            </MenuItem>
            <MenuItem>Lock now</MenuItem>
            <MenuSeparator />
            <MenuItem destructive icon={<Icon />} onSelect={onLogout}>
                Log out
            </MenuItem>
        </Menu>
    );
}

describe('Menu', () => {
    it('is your trigger content in a labelled button controlling a menu popover', () => {
        render(<Account />);
        const button = screen.getByRole('button', { name: 'Account menu' });
        const menu = screen.getByRole('menu', { hidden: true });
        expect(button).toHaveTextContent('R');
        expect(button).toHaveClass('rounded-full');
        expect(button).toHaveAttribute('aria-haspopup', 'menu');
        expect(button).toHaveAttribute('popovertarget', menu.id);
        expect(menu).toHaveAttribute('popover', 'auto');
        expect(menu).toHaveClass('w-64');
    });

    it('header and separators are not items', () => {
        render(<Account />);
        expect(screen.getAllByRole('menuitem', { hidden: true }).map((i) => i.textContent)).toEqual([
            'Settings',
            'Lock now',
            'Log out',
        ]);
        expect(screen.getAllByRole('separator', { hidden: true })).toHaveLength(2);
    });

    it('closes, then runs the chosen item', () => {
        const onSettings = vi.fn();
        render(<Account onSettings={onSettings} />);
        const menu = screen.getByRole('menu', { hidden: true });
        fireEvent.click(screen.getByRole('menuitem', { name: 'Settings', hidden: true }));
        expect(menu.hidePopover).toHaveBeenCalled();
        expect(onSettings).toHaveBeenCalledTimes(1);
    });

    it('icons are muted, except on destructive items, which are red', () => {
        render(<Account />);
        const [settingsIcon, logoutIcon] = screen.getAllByTestId('icon', {}).map((i) => i.parentElement!);
        expect(settingsIcon).toHaveClass('text-muted-foreground');
        expect(logoutIcon).not.toHaveClass('text-muted-foreground');
        expect(screen.getByRole('menuitem', { name: 'Log out', hidden: true })).toHaveClass('text-destructive');
    });

    it('arrow keys move between items only, wrapping', () => {
        render(<Account />);
        const menu = screen.getByRole('menu', { hidden: true });
        const item = (name: string) => screen.getByRole('menuitem', { name, hidden: true });
        fireEvent.keyDown(menu, { key: 'ArrowDown' });
        expect(item('Settings')).toHaveFocus();
        fireEvent.keyDown(menu, { key: 'ArrowUp' });
        expect(item('Log out')).toHaveFocus();
        fireEvent.keyDown(menu, { key: 'ArrowDown' });
        expect(item('Settings')).toHaveFocus();
    });

    it('asChild puts the item on your own element, e.g. a link', () => {
        const onSelect = vi.fn();
        render(
            <Menu label="Go" trigger="Go">
                <MenuItem asChild onSelect={onSelect}>
                    <a href="#settings">Settings</a>
                </MenuItem>
            </Menu>,
        );
        const link = screen.getByRole('menuitem', { name: 'Settings', hidden: true });
        expect(link.tagName).toBe('A');
        fireEvent.click(link);
        expect(onSelect).toHaveBeenCalledTimes(1);
    });
});
