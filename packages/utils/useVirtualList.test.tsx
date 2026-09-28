import { act, render } from '@testing-library/react';
import { useRef } from 'react';

import { useVirtualList } from './useVirtualList';

function List({ count, onRender }: { count: number; onRender: (r: ReturnType<typeof useVirtualList>) => void }) {
    const ref = useRef<HTMLDivElement>(null);
    const rows = useVirtualList({ count, itemHeight: 20, scrollRef: ref, overscan: 2 });
    onRender(rows);
    return (
        <div ref={ref} data-testid="scroller">
            {rows.items.map((r) => (
                <div key={r.index}>{r.index}</div>
            ))}
        </div>
    );
}

/** jsdom has no layout: give the scroller a height and scroll position. */
function size(el: HTMLElement, height: number, scrollTop = 0) {
    Object.defineProperty(el, 'clientHeight', { configurable: true, value: height });
    Object.defineProperty(el, 'scrollTop', { configurable: true, writable: true, value: scrollTop });
}

describe('useVirtualList', () => {
    it('before measuring, renders a first page of ten rows plus overscan', () => {
        let rows!: ReturnType<typeof useVirtualList>;
        render(<List count={1000} onRender={(r) => (rows = r)} />);
        expect(rows.items.map((r) => r.index)).toEqual([...Array(12).keys()]);
        expect(rows.totalSize).toBe(20_000);
    });

    it('renders only the rows in view (plus overscan) as it scrolls', () => {
        let rows!: ReturnType<typeof useVirtualList>;
        const { getByTestId } = render(<List count={1000} onRender={(r) => (rows = r)} />);
        const scroller = getByTestId('scroller');
        // 100px tall, scrolled to row 50.
        size(scroller, 100, 1000);
        act(() => scroller.dispatchEvent(new Event('scroll')));
        expect(rows.items[0]).toEqual({ index: 48, start: 960, size: 20 });
        expect(rows.items.at(-1)?.index).toBe(56);
    });

    it('never goes past the ends', () => {
        let rows!: ReturnType<typeof useVirtualList>;
        render(<List count={3} onRender={(r) => (rows = r)} />);
        expect(rows.items.map((r) => r.index)).toEqual([0, 1, 2]);
    });

    it('reports the space above and below the rendered rows', () => {
        let rows!: ReturnType<typeof useVirtualList>;
        const { getByTestId } = render(<List count={1000} onRender={(r) => (rows = r)} />);
        const scroller = getByTestId('scroller');
        size(scroller, 100, 1000);
        act(() => scroller.dispatchEvent(new Event('scroll')));
        expect(rows.paddingTop).toBe(48 * 20);
        expect(rows.paddingBottom).toBe(rows.totalSize - 57 * 20);
    });
});
