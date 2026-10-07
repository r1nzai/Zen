import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';

import { Canvas, type CanvasItemRect, CanvasItem, type CanvasProps } from './index';

function Board({ scale, snap, onChange = () => {} }: Partial<CanvasProps>) {
    const [items, setItems] = useState<CanvasItemRect[]>([
        { id: 'title', x: 100, y: 40, w: 80, h: 40 },
        { id: 'bar', x: 10, y: 10, w: 40, h: 10 },
    ]);
    const [selected, setSelected] = useState<string | null>(null);
    return (
        <Canvas
            aria-label="Overlay"
            width={400}
            height={120}
            scale={scale}
            snap={snap}
            items={items}
            selected={selected}
            onSelect={setSelected}
            onChange={(id, rect) => {
                setItems((all) => all.map((i) => (i.id === id ? { id, ...rect } : i)));
                onChange(id, rect);
            }}
        >
            <CanvasItem id="title" label="Title">
                Hello
            </CanvasItem>
            <CanvasItem id="bar" label="Bar" />
        </Canvas>
    );
}

const item = (name: string) => screen.getByRole('group', { name });
const place = (el: HTMLElement) => [el.style.left, el.style.top, el.style.width, el.style.height].join(' ');

describe('Canvas', () => {
    it('places items, and selects one on focus', () => {
        render(<Board />);
        expect(place(item('Title'))).toBe('100px 40px 80px 40px');
        act(() => item('Title').focus());
        expect(item('Title')).toHaveAttribute('data-selected');
        expect(item('Title').querySelectorAll('[data-handle]')).toHaveLength(8);
        expect(item('Bar')).not.toHaveAttribute('data-selected');
    });

    it('moves with the arrow keys, Shift by 10, and says where', () => {
        render(<Board />);
        fireEvent.keyDown(item('Title'), { key: 'ArrowRight' });
        fireEvent.keyDown(item('Title'), { key: 'ArrowUp', shiftKey: true });
        expect(place(item('Title'))).toBe('101px 30px 80px 40px');
        expect(screen.getByText('Title moved to 101, 30.')).toBeInTheDocument();
    });

    it('resizes with Alt and the arrow keys, no smaller than the minimum', () => {
        render(<Board />);
        fireEvent.keyDown(item('Bar'), { key: 'ArrowRight', altKey: true, shiftKey: true });
        expect(place(item('Bar'))).toBe('10px 10px 50px 10px');
        expect(screen.getByText('Bar resized to 50 by 10.')).toBeInTheDocument();
        fireEvent.keyDown(item('Bar'), { key: 'ArrowUp', altKey: true, shiftKey: true });
        expect(place(item('Bar'))).toBe('10px 10px 50px 8px');
    });

    it('stays on the surface', () => {
        const onChange = vi.fn();
        render(<Board onChange={onChange} />);
        for (let i = 0; i < 3; i++) fireEvent.keyDown(item('Bar'), { key: 'ArrowLeft', shiftKey: true });
        expect(place(item('Bar'))).toBe('0px 10px 40px 10px');
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('drags an item, by the pointer distance over the scale', () => {
        render(<Board scale={2} />);
        fireEvent.pointerDown(item('Title'), { button: 0, pointerId: 1, clientX: 300, clientY: 100 });
        fireEvent.pointerMove(item('Title'), { pointerId: 1, clientX: 340, clientY: 120 });
        fireEvent.pointerUp(item('Title'), { pointerId: 1, clientX: 340, clientY: 120 });
        expect(place(item('Title'))).toBe('120px 50px 80px 40px');
        expect(item('Title')).toHaveAttribute('data-selected');
        expect(screen.getByText('Title moved to 120, 50.')).toBeInTheDocument();
    });

    it('resizes from a handle, and shows snap guides while dragging', () => {
        render(<Board snap />);
        act(() => item('Title').focus());
        const se = item('Title').querySelector<HTMLElement>('[data-handle="se"]')!;
        fireEvent.pointerDown(se, { button: 0, pointerId: 1, clientX: 0, clientY: 0 });
        fireEvent.pointerMove(se, { pointerId: 1, clientX: 18, clientY: 0 });
        expect(place(item('Title'))).toBe('100px 40px 100px 40px');
        expect(screen.getByRole('group', { name: 'Overlay' }).querySelectorAll('.bg-primary')).toHaveLength(1);
        fireEvent.pointerUp(se, { pointerId: 1 });
        expect(screen.getByRole('group', { name: 'Overlay' }).querySelectorAll('.bg-primary')).toHaveLength(0);
        expect(screen.getByText('Title resized to 100 by 40.')).toBeInTheDocument();
    });

    it('deselects on Escape and on empty space', () => {
        render(<Board />);
        act(() => item('Title').focus());
        fireEvent.keyDown(item('Title'), { key: 'Escape' });
        expect(item('Title')).not.toHaveAttribute('data-selected');
        fireEvent.pointerDown(item('Bar'), { button: 0, pointerId: 1 });
        expect(item('Bar')).toHaveAttribute('data-selected');
        fireEvent.pointerDown(screen.getByRole('group', { name: 'Overlay' }));
        expect(item('Bar')).not.toHaveAttribute('data-selected');
    });
});
