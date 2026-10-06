import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';

import { SortableHandle, SortableItem, SortableList } from './index';

const NAMES: Record<string, string> = { a: 'Rent', b: 'Food', c: 'Fun' };

function List({ onChange = () => {} }: { onChange?: (v: string[]) => void }) {
    const [order, setOrder] = useState(['a', 'b', 'c']);
    return (
        <SortableList
            aria-label="Budgets"
            value={order}
            onChange={(v) => {
                setOrder(v);
                onChange(v);
            }}
        >
            {order.map((id) => (
                <SortableItem key={id} id={id}>
                    <SortableHandle id={id} label={NAMES[id]} />
                    {NAMES[id]}
                </SortableItem>
            ))}
        </SortableList>
    );
}

const order = () => screen.getAllByRole('listitem').map((li) => li.textContent);
const handle = (name: string) => screen.getByRole('button', { name: `Reorder ${name}` });

describe('SortableList', () => {
    it('moves an item with the keyboard: pick up, arrows, drop, saying each step', () => {
        render(<List />);
        fireEvent.keyDown(handle('Rent'), { key: ' ' });
        expect(handle('Rent')).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByText(/Rent picked up, 1 of 3/)).toBeInTheDocument();
        fireEvent.keyDown(handle('Rent'), { key: 'ArrowDown' });
        fireEvent.keyDown(handle('Rent'), { key: 'ArrowDown' });
        expect(order()).toEqual(['Food', 'Fun', 'Rent']);
        expect(screen.getByText('Rent, 3 of 3.')).toBeInTheDocument();
        fireEvent.keyDown(handle('Rent'), { key: 'ArrowDown' });
        expect(order()).toEqual(['Food', 'Fun', 'Rent']);
        fireEvent.keyDown(handle('Rent'), { key: 'Enter' });
        expect(handle('Rent')).toHaveAttribute('aria-pressed', 'false');
        expect(screen.getByText('Rent dropped, 3 of 3.')).toBeInTheDocument();
    });

    it('Escape puts a picked-up item back where it was', () => {
        const onChange = vi.fn();
        render(<List onChange={onChange} />);
        fireEvent.keyDown(handle('Fun'), { key: ' ' });
        fireEvent.keyDown(handle('Fun'), { key: 'ArrowUp' });
        fireEvent.keyDown(handle('Fun'), { key: 'ArrowUp' });
        expect(order()).toEqual(['Fun', 'Rent', 'Food']);
        fireEvent.keyDown(handle('Fun'), { key: 'Escape' });
        expect(order()).toEqual(['Rent', 'Food', 'Fun']);
        expect(onChange).toHaveBeenLastCalledWith(['a', 'b', 'c']);
        expect(screen.getByText('Fun put back, 3 of 3.')).toBeInTheDocument();
    });

    it('moves an item dragged past others by its handle', () => {
        render(<List />);
        // Items 40px tall, one under another.
        const items = screen.getAllByRole('listitem');
        items.forEach((li, i) =>
            vi
                .spyOn(li, 'getBoundingClientRect')
                .mockReturnValue({ top: i * 40, bottom: i * 40 + 40, height: 40 } as DOMRect),
        );
        const grip = handle('Rent');
        fireEvent.pointerDown(grip, { button: 0, pointerId: 1, clientY: 20 });
        fireEvent.pointerMove(grip, { pointerId: 1, clientY: 70 });
        expect(items[0].style.translate).toBe('0 50px');
        expect(items[1].style.translate).toBe('0 -40px');
        fireEvent.pointerUp(grip, { pointerId: 1, clientY: 70 });
        expect(order()).toEqual(['Food', 'Rent', 'Fun']);
        expect(items[1].style.translate).toBe('');
    });
});
