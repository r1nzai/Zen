import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';

import { Canvas, type CanvasItemRect, CanvasItem, type CanvasProps } from './index';

interface Card extends CanvasItemRect {
    kind: string;
}

const START: Card[] = [
    { id: 'title', kind: 'text', x: 100, y: 40, w: 80, h: 40 },
    { id: 'bar', kind: 'bar', x: 10, y: 10, w: 40, h: 10 },
    { id: 'bg', kind: 'image', x: 300, y: 0, w: 100, h: 120, locked: true },
];

function Board({
    onItemsChange = () => {},
    onItemsChangeEnd,
    withInput,
    ...rest
}: Partial<CanvasProps<Card>> & { withInput?: boolean }) {
    const [items, setItems] = useState<Card[]>(START);
    const [selected, setSelected] = useState<string[]>([]);
    return (
        <Canvas
            aria-label="Overlay"
            width={400}
            height={120}
            items={items}
            selected={selected}
            onSelectedChange={setSelected}
            onItemsChange={(next) => {
                setItems(next);
                onItemsChange(next);
            }}
            onItemsChangeEnd={onItemsChangeEnd}
            {...rest}
        >
            <CanvasItem id="bg" label="Background" />
            <CanvasItem id="title" label="Title">
                {withInput ? <input aria-label="Text" /> : 'Hello'}
            </CanvasItem>
            <CanvasItem id="bar" label="Bar" />
        </Canvas>
    );
}

const item = (name: string) => screen.getByRole('group', { name });
const surface = () => item('Overlay');
const place = (el: HTMLElement) => [el.style.left, el.style.top, el.style.width, el.style.height].join(' ');
const press = (el: Element, x: number, y: number, init: object = {}) =>
    fireEvent.pointerDown(el, { button: 0, pointerId: 1, clientX: x, clientY: y, ...init });
const drag = (el: Element, x: number, y: number) => fireEvent.pointerMove(el, { pointerId: 1, clientX: x, clientY: y });
const release = (el: Element) => fireEvent.pointerUp(el, { pointerId: 1 });

describe('Canvas', () => {
    it('places items, and selects one on keyboard focus', () => {
        render(<Board />);
        expect(place(item('Title'))).toBe('100px 40px 80px 40px');
        act(() => item('Title').focus());
        expect(item('Title')).toHaveAttribute('data-selected');
        expect(item('Title').querySelectorAll('[data-handle]')).toHaveLength(8);
    });

    it('moves with the arrow keys, Shift by 10, keeping other fields, and says where', () => {
        const onItemsChangeEnd = vi.fn();
        render(<Board onItemsChangeEnd={onItemsChangeEnd} />);
        fireEvent.keyDown(item('Title'), { key: 'ArrowRight' });
        fireEvent.keyDown(item('Title'), { key: 'ArrowUp', shiftKey: true });
        expect(place(item('Title'))).toBe('101px 30px 80px 40px');
        expect(screen.getByText('Title moved to 101, 30.')).toBeInTheDocument();
        const [next, before] = onItemsChangeEnd.mock.lastCall!;
        expect(next.find((i: Card) => i.id === 'title')).toEqual({
            id: 'title',
            kind: 'text',
            x: 101,
            y: 30,
            w: 80,
            h: 40,
        });
        expect(before.find((i: Card) => i.id === 'title').y).toBe(40);
    });

    it('resizes with Alt and the arrow keys, no smaller than the minimum', () => {
        render(<Board />);
        fireEvent.keyDown(item('Bar'), { key: 'ArrowRight', altKey: true, shiftKey: true });
        expect(place(item('Bar'))).toBe('10px 10px 50px 10px');
        expect(screen.getByText('Bar resized to 50 by 10.')).toBeInTheDocument();
        fireEvent.keyDown(item('Bar'), { key: 'ArrowUp', altKey: true, shiftKey: true });
        expect(place(item('Bar'))).toBe('10px 10px 50px 8px');
    });

    it('stays on the surface, and reports nothing when nothing moves', () => {
        const onChange = vi.fn();
        render(<Board onItemsChange={onChange} />);
        for (let i = 0; i < 3; i++) fireEvent.keyDown(item('Bar'), { key: 'ArrowLeft', shiftKey: true });
        expect(place(item('Bar'))).toBe('0px 10px 40px 10px');
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('drags by the pointer distance over the scale, ending once', () => {
        const onItemsChangeEnd = vi.fn();
        render(<Board scale={2} onItemsChangeEnd={onItemsChangeEnd} />);
        press(item('Title'), 300, 100);
        drag(item('Title'), 320, 110);
        drag(item('Title'), 340, 120);
        release(item('Title'));
        expect(place(item('Title'))).toBe('120px 50px 80px 40px');
        expect(item('Title')).toHaveAttribute('data-selected');
        expect(item('Title')).toHaveFocus();
        expect(onItemsChangeEnd).toHaveBeenCalledTimes(1);
        expect(screen.getByText('Title moved to 120, 50.')).toBeInTheDocument();
    });

    it('moves nothing for a press that barely moves', () => {
        const onChange = vi.fn();
        render(<Board onItemsChange={onChange} />);
        press(item('Title'), 0, 0);
        drag(item('Title'), 2, 1);
        release(item('Title'));
        expect(onChange).not.toHaveBeenCalled();
        expect(item('Title')).toHaveAttribute('data-selected');
    });

    it('puts a drag back on Escape', () => {
        const onItemsChangeEnd = vi.fn();
        render(<Board onItemsChangeEnd={onItemsChangeEnd} />);
        press(item('Title'), 0, 0);
        drag(item('Title'), 50, 0);
        expect(place(item('Title'))).toBe('150px 40px 80px 40px');
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(place(item('Title'))).toBe('100px 40px 80px 40px');
        expect(item('Title')).toHaveAttribute('data-selected');
        drag(item('Title'), 80, 0);
        expect(place(item('Title'))).toBe('100px 40px 80px 40px');
        expect(onItemsChangeEnd).not.toHaveBeenCalled();
        expect(screen.getByText('Title put back.')).toBeInTheDocument();
    });

    it('resizes from a handle, showing guides and the size while dragging', () => {
        render(<Board snap />);
        act(() => item('Title').focus());
        const se = item('Title').querySelector('[data-handle="se"]')!;
        press(se, 0, 0);
        drag(se, 18, 0);
        expect(place(item('Title'))).toBe('100px 40px 100px 40px');
        expect(surface().querySelector('[data-canvas-guide]')).not.toBeNull();
        expect(surface().querySelector('[data-canvas-readout]')).toHaveTextContent('100 × 40');
        release(se);
        expect(surface().querySelector('[data-canvas-guide]')).toBeNull();
        expect(surface().querySelector('[data-canvas-readout]')).toBeNull();
        expect(screen.getByText('Title resized to 100 by 40.')).toBeInTheDocument();
    });

    it('keeps to the grid, its dots showing while dragging', () => {
        render(<Board grid={8} />);
        press(item('Title'), 0, 0);
        drag(item('Title'), 13, 5);
        expect(place(item('Title'))).toBe('112px 48px 80px 40px');
        expect(surface().querySelector('[data-canvas-grid]')).not.toBeNull();
        release(item('Title'));
        expect(surface().querySelector('[data-canvas-grid]')).toBeNull();
    });

    it('selects several with Shift, and moves them together', () => {
        render(<Board />);
        press(item('Title'), 0, 0);
        release(item('Title'));
        press(item('Bar'), 0, 0, { shiftKey: true });
        release(item('Bar'));
        expect(item('Title')).toHaveAttribute('data-selected');
        expect(item('Bar')).toHaveAttribute('data-selected');
        expect(surface().querySelectorAll('[data-handle]')).toHaveLength(0);
        fireEvent.keyDown(item('Bar'), { key: 'ArrowDown', shiftKey: true });
        expect(place(item('Title'))).toBe('100px 50px 80px 40px');
        expect(place(item('Bar'))).toBe('10px 20px 40px 10px');
        expect(screen.getByText('2 items moved to 10, 20.')).toBeInTheDocument();
        press(item('Title'), 0, 0, { metaKey: true });
        release(item('Title'));
        expect(item('Title')).not.toHaveAttribute('data-selected');
    });

    it('selects what a box drawn on empty space touches, and deselects on a plain press there, not a scroll', () => {
        render(<Board />);
        press(surface(), 5, 5);
        drag(surface(), 60, 30);
        expect(surface().querySelector('[data-canvas-marquee]')).not.toBeNull();
        release(surface());
        expect(surface().querySelector('[data-canvas-marquee]')).toBeNull();
        expect(item('Bar')).toHaveAttribute('data-selected');
        expect(item('Title')).not.toHaveAttribute('data-selected');
        expect(screen.getByText('1 item selected.')).toBeInTheDocument();
        press(surface(), 5, 100);
        fireEvent.pointerCancel(surface(), { pointerId: 1 });
        expect(item('Bar')).toHaveAttribute('data-selected');
        press(surface(), 5, 100);
        release(surface());
        expect(item('Bar')).not.toHaveAttribute('data-selected');
    });

    it('selects all with Ctrl+A but a locked item, which keys leave in place', () => {
        render(<Board />);
        fireEvent.keyDown(item('Title'), { key: 'a', ctrlKey: true });
        expect(item('Title')).toHaveAttribute('data-selected');
        expect(item('Background')).not.toHaveAttribute('data-selected');
        fireEvent.keyDown(item('Background'), { key: 'ArrowLeft' });
        expect(place(item('Background'))).toBe('300px 0px 100px 120px');
    });

    it('lets presses on a locked item through to the surface: a box, or deselecting', () => {
        render(<Board />);
        act(() => item('Title').focus());
        press(item('Background'), 310, 5);
        release(item('Background'));
        expect(item('Background')).not.toHaveAttribute('data-selected');
        expect(item('Title')).not.toHaveAttribute('data-selected');
        press(item('Background'), 310, 5);
        drag(item('Background'), 90, 50);
        release(item('Background'));
        expect(item('Title')).toHaveAttribute('data-selected');
        expect(item('Bar')).not.toHaveAttribute('data-selected');
        expect(place(item('Background'))).toBe('300px 0px 100px 120px');
        expect(item('Background')).toHaveAttribute('aria-roledescription', 'locked item');
        expect(item('Background').querySelectorAll('[data-handle]')).toHaveLength(0);
    });

    it('leaves presses on a field inside an item to the field', () => {
        const onChange = vi.fn();
        render(<Board withInput onChange={onChange} />);
        const input = screen.getByRole('textbox', { name: 'Text' });
        press(input, 0, 0);
        drag(input, 50, 0);
        release(input);
        expect(onChange).not.toHaveBeenCalled();
        fireEvent.keyDown(input, { key: 'ArrowRight' });
        expect(onChange).not.toHaveBeenCalled();
    });

    it('fits the width it is given with scale="fit"', () => {
        const width = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(800);
        render(<Board scale="fit" />);
        const inner = surface().firstElementChild as HTMLElement;
        expect(inner.style.scale).toBe('2');
        expect(surface().style.aspectRatio).toBe('400 / 120');
        width.mockRestore();
    });
});
