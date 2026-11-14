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
            onValueChange={(v) => {
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

describe('SortableList asChild', () => {
    function Rows({ onChange }: { onChange: (v: string[]) => void }) {
        const [order, setOrder] = useState(['a', 'b']);
        return (
            <table>
                <SortableList
                    asChild
                    value={order}
                    onValueChange={(v) => {
                        setOrder(v);
                        onChange(v);
                    }}
                >
                    <tbody className="mine">
                        <tr>
                            <th>Heading</th>
                        </tr>
                        {order.map((id) => (
                            <SortableItem key={id} id={id} asChild>
                                <tr>
                                    <td>
                                        <SortableHandle id={id} label={NAMES[id]} />
                                        {NAMES[id]}
                                    </td>
                                </tr>
                            </SortableItem>
                        ))}
                    </tbody>
                </SortableList>
            </table>
        );
    }

    it('sorts your own rows, leaving others (a heading row) where they are, with valid table markup', () => {
        const onChange = vi.fn();
        const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { container } = render(<Rows onChange={onChange} />);
        const body = container.querySelector('tbody')!;
        expect(body).toHaveClass('mine', 'zen__sortable');
        expect(body).not.toHaveClass('flex');
        fireEvent.keyDown(handle('Rent'), { key: ' ' });
        fireEvent.keyDown(handle('Rent'), { key: 'ArrowDown' });
        expect(onChange).toHaveBeenLastCalledWith(['b', 'a']);
        expect([...body.rows].map((r) => r.textContent)).toEqual(['Heading', 'Food', 'Rent']);
        expect(body.rows[2]).toHaveAttribute('data-lifted');
        // Announced from outside the table.
        expect(screen.getByText('Rent, 2 of 2.').closest('table')).toBeNull();
        expect(errors).not.toHaveBeenCalled();
    });

    it('drags in a virtualized list (itemHeight), placing rows that mount mid-drag', () => {
        const ids = Array.from({ length: 100 }, (_, i) => `i${i}`);
        const onLiftedChange = vi.fn();
        const onValueChange = vi.fn();
        // Rows 40px apart, placed by their place in the list.
        const Row = ({ i }: { i: number }) => (
            <SortableItem
                id={ids[i]}
                ref={(li) => {
                    if (li)
                        vi.spyOn(li, 'getBoundingClientRect').mockReturnValue({
                            top: i * 40,
                            bottom: i * 40 + 40,
                            height: 40,
                        } as DOMRect);
                }}
            >
                <SortableHandle id={ids[i]} label={`Song ${i}`} />
            </SortableItem>
        );
        const Windowed = ({ rows }: { rows: number[] }) => (
            <SortableList value={ids} onValueChange={onValueChange} itemHeight={40} onLiftedChange={onLiftedChange}>
                {rows.map((i) => (
                    <Row key={i} i={i} />
                ))}
            </SortableList>
        );
        const { rerender } = render(<Windowed rows={[50, 51, 52]} />);
        fireEvent.pointerDown(handle('Song 50'), { button: 0, pointerId: 1, clientY: 2020 });
        expect(onLiftedChange).toHaveBeenLastCalledWith('i50');
        fireEvent.pointerMove(window, { pointerId: 1, clientY: 2020 + 130 });
        // Rows the list hasn't rendered yet still count: 130px down is three places on.
        rerender(<Windowed rows={[50, 51, 52, 53, 54]} />);
        const items = screen.getAllByRole('listitem');
        expect(items[0].style.translate).toBe('0 130px');
        expect(items[1].style.translate).toBe('0 -40px');
        expect(items[3].style.translate).toBe('0 -40px');
        expect(items[4].style.translate).toBe('');
        fireEvent.pointerUp(window, { pointerId: 1 });
        expect(onLiftedChange).toHaveBeenLastCalledWith(null);
        expect(onValueChange.mock.calls[0][0].slice(50, 55)).toEqual(['i51', 'i52', 'i53', 'i50', 'i54']);
    });
});
