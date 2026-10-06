import { act, fireEvent, render, screen } from '@testing-library/react';

import Menu, { MenuContent, MenuContextTrigger, MenuHeader, MenuItem, MenuSeparator, MenuTrigger } from './index';

const Icon = () => <svg data-testid="icon" className="size-4" />;

function Account({ onSettings = () => {}, onLogout = () => {} }: { onSettings?: () => void; onLogout?: () => void }) {
    return (
        <Menu>
            <MenuTrigger aria-label="Account menu" className="rounded-full">
                <span>R</span>
            </MenuTrigger>
            <MenuContent className="w-64">
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
            </MenuContent>
        </Menu>
    );
}

describe('Menu', () => {
    it('is your trigger content in a labelled button controlling a menu popover named after it', () => {
        render(<Account />);
        const button = screen.getByRole('button', { name: 'Account menu' });
        const menu = screen.getByRole('menu', { hidden: true });
        // Named after its button (not computed here: jsdom hides closed popovers).
        expect(menu).toHaveAttribute('aria-labelledby', button.id);
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

    it('items are left-aligned (a button centres its text), so fixed-width columns line up', () => {
        render(<Account />);
        expect(screen.getByRole('menuitem', { name: 'Settings', hidden: true })).toHaveClass('text-left');
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
            <Menu>
                <MenuTrigger>Go</MenuTrigger>
                <MenuContent>
                    <MenuItem asChild onSelect={onSelect}>
                        <a href="#settings">Settings</a>
                    </MenuItem>
                </MenuContent>
            </Menu>,
        );
        const link = screen.getByRole('menuitem', { name: 'Settings', hidden: true });
        expect(link.tagName).toBe('A');
        fireEvent.click(link);
        expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('asChild on the trigger: your own button gets the popup wiring', () => {
        render(
            <Menu>
                <MenuTrigger asChild>
                    <button className="mine">Open</button>
                </MenuTrigger>
                <MenuContent>
                    <MenuItem>Edit</MenuItem>
                </MenuContent>
            </Menu>,
        );
        const button = screen.getByRole('button', { name: 'Open' });
        expect(button).toHaveClass('mine');
        expect(button).toHaveAttribute('popovertarget', screen.getByRole('menu', { hidden: true }).id);
    });

    it('parts outside a Menu say so', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => render(<MenuTrigger>Go</MenuTrigger>)).toThrow('<MenuTrigger> must be inside <Menu>');
    });
});

describe('MenuContextTrigger', () => {
    const onOpen = vi.fn();
    beforeEach(() => onOpen.mockClear());
    function Row({ onTap = () => {}, disabled = false }: { onTap?: () => void; disabled?: boolean }) {
        return (
            <Menu onOpenChange={onOpen}>
                <MenuContextTrigger disabled={disabled} onClick={onTap}>
                    Weekly shop
                </MenuContextTrigger>
                <MenuContent aria-label="Entry actions">
                    <MenuItem>Edit</MenuItem>
                </MenuContent>
            </Menu>
        );
    }
    const anchor = () => document.body.querySelector<HTMLElement>('body > [data-zen-anchor]');

    it('opens where the pointer is on a right-click, instead of the browser menu', () => {
        render(<Row />);
        const menu = screen.getByRole('menu', { hidden: true });
        const event = fireEvent.contextMenu(screen.getByText('Weekly shop'), { clientX: 120, clientY: 80 });
        expect(event).toBe(false); // default prevented
        expect(onOpen).toHaveBeenCalledWith(true);
        expect(anchor()).toHaveStyle({ left: '120px', top: '80px', position: 'fixed' });
        expect(menu).toHaveAttribute('aria-label', 'Entry actions');
        expect(menu).not.toHaveAttribute('aria-labelledby');
    });

    it('opens on a long press, and the tap that ends it does nothing', () => {
        vi.useFakeTimers();
        const onTap = vi.fn();
        render(<Row onTap={onTap} />);
        const row = screen.getByText('Weekly shop');
        fireEvent.pointerDown(row, { pointerType: 'touch', isPrimary: true, clientX: 50, clientY: 40 });
        act(() => {
            vi.advanceTimersByTime(499);
        });
        expect(onOpen).not.toHaveBeenCalled();
        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(onOpen).toHaveBeenCalledWith(true);
        fireEvent.pointerUp(row, { pointerType: 'touch' });
        fireEvent.click(row);
        expect(onTap).not.toHaveBeenCalled();
        vi.useRealTimers();
    });

    it('a press that moves is a scroll, not a long press', () => {
        vi.useFakeTimers();
        render(<Row />);
        const row = screen.getByText('Weekly shop');
        fireEvent.pointerDown(row, { pointerType: 'touch', isPrimary: true, clientX: 50, clientY: 40 });
        fireEvent.pointerMove(row, { pointerType: 'touch', clientX: 50, clientY: 70 });
        vi.advanceTimersByTime(600);
        expect(onOpen).not.toHaveBeenCalled();
        vi.useRealTimers();
    });

    it("the press that opened it is the menu's, so letting go is not a click outside", () => {
        vi.useFakeTimers();
        const capture = vi.fn();
        HTMLElement.prototype.setPointerCapture = capture;
        render(<Row />);
        fireEvent.pointerDown(screen.getByText('Weekly shop'), {
            pointerType: 'touch',
            isPrimary: true,
            pointerId: 7,
        });
        act(() => {
            vi.advanceTimersByTime(500);
        });
        expect(capture).toHaveBeenCalledWith(7);
        expect(capture.mock.contexts[0]).toBe(screen.getByRole('menu', { hidden: true }));
        delete (HTMLElement.prototype as Partial<HTMLElement>).setPointerCapture;
        vi.useRealTimers();
    });

    it('marks the one it was opened from, and anchors there', () => {
        render(
            <Menu>
                <MenuContextTrigger>Weekly shop</MenuContextTrigger>
                <MenuContextTrigger>Train pass</MenuContextTrigger>
                <MenuContent aria-label="Entry actions">
                    <MenuItem>Edit</MenuItem>
                </MenuContent>
            </Menu>,
        );
        fireEvent.contextMenu(screen.getByText('Train pass'), { clientX: 120, clientY: 80 });
        expect(screen.getByText('Train pass')).toHaveAttribute('data-popup-open');
        expect(screen.getByText('Weekly shop')).not.toHaveAttribute('data-popup-open');
        expect(document.body.querySelectorAll('body > [data-zen-anchor]')).toHaveLength(1);
    });

    it('a MenuTrigger beside it does not show as open when it opened from a right-click', () => {
        render(
            <Menu>
                <MenuContextTrigger>Weekly shop</MenuContextTrigger>
                <MenuTrigger aria-label="Actions">⋯</MenuTrigger>
                <MenuContent aria-label="Entry actions">
                    <MenuItem>Edit</MenuItem>
                </MenuContent>
            </Menu>,
        );
        fireEvent.contextMenu(screen.getByText('Weekly shop'), { clientX: 120, clientY: 80 });
        const button = screen.getByRole('button', { name: 'Actions' });
        expect(button).toHaveAttribute('aria-expanded', 'false');
        expect(button).not.toHaveAttribute('data-popup-open');
    });

    it('when disabled, leaves the browser its own menu', () => {
        render(<Row disabled />);
        expect(fireEvent.contextMenu(screen.getByText('Weekly shop'))).toBe(true);
    });
});
