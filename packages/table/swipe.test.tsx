import { fireEvent, render, screen } from '@testing-library/react';

import Table, { TableBody, TableCell, TableContainer, TableSwipeRow } from './index';

describe('TableSwipeRow', () => {
    let now = 0;
    const touch = (el: Element, type: 'down' | 'move' | 'up', x: number) => {
        now += 16;
        const init = { clientX: x, clientY: 100, pointerId: 1, pointerType: 'touch', isPrimary: true };
        if (type === 'down') fireEvent.pointerDown(el, init);
        else if (type === 'move') fireEvent.pointerMove(el, init);
        else fireEvent.pointerUp(el, init);
    };
    const swipe = (el: Element, dx: number) => {
        touch(el, 'down', 200);
        touch(el, 'move', 200 + dx / 2);
        touch(el, 'move', 200 + dx);
        touch(el, 'up', 200 + dx);
    };
    beforeEach(() => {
        vi.spyOn(Event.prototype, 'timeStamp', 'get').mockImplementation(() => now);
        vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(80);
    });
    afterEach(() => vi.restoreAllMocks());

    const onDelete = vi.fn();
    const setup = () =>
        render(
            <TableContainer label="Entries">
                <Table>
                    <TableBody>
                        <TableSwipeRow actions={<button onClick={onDelete}>Delete</button>}>
                            <TableCell>Weekly shop</TableCell>
                        </TableSwipeRow>
                    </TableBody>
                </Table>
            </TableContainer>,
        );
    const row = () => screen.getByRole('row');

    it('opens when swiped left past half its actions (not short of it), and a tap on the row closes it', () => {
        setup();
        swipe(screen.getByText('Weekly shop'), -20);
        expect(row()).not.toHaveAttribute('data-open');
        expect(row().style.getPropertyValue('--zen-row-swipe')).toBe('0px');
        swipe(screen.getByText('Weekly shop'), -60);
        expect(row()).toHaveAttribute('data-open');
        expect(row().style.getPropertyValue('--zen-row-swipe')).toBe('80px');
        fireEvent.click(screen.getByText('Weekly shop'));
        expect(row()).not.toHaveAttribute('data-open');
    });

    it('closes when swiped back right, and ignores a swipe right while closed', () => {
        setup();
        swipe(screen.getByText('Weekly shop'), 60);
        expect(row().style.getPropertyValue('--zen-row-swipe')).toBe('');
        swipe(screen.getByText('Weekly shop'), -60);
        swipe(screen.getByText('Weekly shop'), 60);
        expect(row()).not.toHaveAttribute('data-open');
    });

    it('brings the actions out for the keyboard, and they still work', () => {
        setup();
        fireEvent.focus(screen.getByRole('button', { name: 'Delete' }));
        expect(row()).toHaveAttribute('data-open');
        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
        expect(onDelete).toHaveBeenCalled();
        expect(row()).not.toHaveAttribute('data-open');
    });

    it('swipes the other way in a right-to-left layout', () => {
        document.documentElement.dir = 'rtl';
        try {
            setup();
            swipe(screen.getByText('Weekly shop'), -60);
            expect(row()).not.toHaveAttribute('data-open');
            swipe(screen.getByText('Weekly shop'), 60);
            expect(row()).toHaveAttribute('data-open');
        } finally {
            document.documentElement.removeAttribute('dir');
        }
    });

    it('taps lightly as a swipe crosses the point where letting go opens it, each way', () => {
        const vibrate = vi.fn();
        Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true });
        setup();
        const cell = screen.getByText('Weekly shop');
        touch(cell, 'down', 200);
        touch(cell, 'move', 180);
        expect(vibrate).not.toHaveBeenCalled();
        touch(cell, 'move', 150);
        expect(vibrate).toHaveBeenCalledTimes(1);
        touch(cell, 'move', 140);
        touch(cell, 'move', 175);
        expect(vibrate).toHaveBeenCalledTimes(2);
        touch(cell, 'up', 175);
        delete (navigator as { vibrate?: unknown }).vibrate;
    });
});
