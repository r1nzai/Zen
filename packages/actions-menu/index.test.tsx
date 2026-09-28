import { fireEvent, render, screen } from '@testing-library/react';

import ActionsMenu from './index';

describe('ActionsMenu', () => {
    it('is a labelled button that controls a menu popover', () => {
        render(<ActionsMenu label="Goal actions" actions={[{ label: 'Edit', onClick: () => {} }]} />);
        const button = screen.getByRole('button', { name: 'Goal actions' });
        const menu = screen.getByRole('menu', { hidden: true });
        expect(button).toHaveAttribute('aria-haspopup', 'menu');
        expect(button).toHaveAttribute('popovertarget', menu.id);
        expect(menu).toHaveAttribute('popover', 'auto');
    });

    it('skips falsy actions', () => {
        render(
            <ActionsMenu
                label="Goal actions"
                actions={[{ label: 'Edit', onClick: () => {} }, false, null, { label: 'Delete', onClick: () => {} }]}
            />,
        );
        expect(screen.getAllByRole('menuitem', { hidden: true }).map((i) => i.textContent)).toEqual(['Edit', 'Delete']);
    });

    it('runs the action and closes the menu', () => {
        const onClick = vi.fn();
        render(<ActionsMenu label="Goal actions" actions={[{ label: 'Edit', onClick }]} />);
        const menu = screen.getByRole('menu', { hidden: true });
        fireEvent.click(screen.getByRole('menuitem', { name: 'Edit', hidden: true }));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(menu.hidePopover).toHaveBeenCalled();
    });

    it('marks destructive actions', () => {
        render(<ActionsMenu label="x" actions={[{ label: 'Delete', onClick: () => {}, destructive: true }]} />);
        expect(screen.getByRole('menuitem', { name: 'Delete', hidden: true })).toHaveClass('text-destructive');
    });

    it('arrow keys move between items, wrapping', () => {
        render(
            <ActionsMenu
                label="x"
                actions={[
                    { label: 'Edit', onClick: () => {} },
                    { label: 'Duplicate', onClick: () => {} },
                    { label: 'Delete', onClick: () => {} },
                ]}
            />,
        );
        const menu = screen.getByRole('menu', { hidden: true });
        const item = (name: string) => screen.getByRole('menuitem', { name, hidden: true });
        fireEvent.keyDown(menu, { key: 'ArrowDown' });
        expect(item('Edit')).toHaveFocus();
        fireEvent.keyDown(menu, { key: 'ArrowUp' });
        expect(item('Delete')).toHaveFocus();
        fireEvent.keyDown(menu, { key: 'ArrowDown' });
        expect(item('Edit')).toHaveFocus();
        fireEvent.keyDown(menu, { key: 'End' });
        expect(item('Delete')).toHaveFocus();
    });
});
