import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';

import { Slot } from './slot';

describe('Slot', () => {
    it('renders the child with the props merged in, classes combined', () => {
        render(
            <Slot className="mine" title="from slot">
                <a href="/x" className="theirs">
                    Link
                </a>
            </Slot>,
        );
        const link = screen.getByRole('link', { name: 'Link' });
        expect(link).toHaveAttribute('href', '/x');
        expect(link).toHaveAttribute('title', 'from slot');
        expect(link).toHaveClass('mine', 'theirs');
    });

    it("runs both click handlers, the child's first", () => {
        const calls: string[] = [];
        render(
            <Slot onClick={() => calls.push('slot')}>
                <button onClick={() => calls.push('child')}>Go</button>
            </Slot>,
        );
        fireEvent.click(screen.getByRole('button'));
        expect(calls).toEqual(['child', 'slot']);
    });

    it("merges styles, the child's winning", () => {
        render(
            <Slot style={{ color: 'red', margin: 1 }}>
                <button style={{ color: 'blue' }}>Go</button>
            </Slot>,
        );
        const style = screen.getByRole('button').style;
        expect(style.color).toBe('blue');
        expect(style.margin).toBe('1px');
    });

    it('gives the element to both refs', () => {
        const mine = createRef<HTMLButtonElement>();
        const theirs = createRef<HTMLButtonElement>();
        render(
            <Slot ref={mine as never}>
                <button ref={theirs}>Go</button>
            </Slot>,
        );
        expect(mine.current).toBe(screen.getByRole('button'));
        expect(theirs.current).toBe(screen.getByRole('button'));
    });
});
