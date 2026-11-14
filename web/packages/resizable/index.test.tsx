import { fireEvent, render, screen } from '@testing-library/react';

import ResizablePanelGroup, { ResizableHandle, ResizablePanel } from './index';

function Split({ onLayout = () => {} }: { onLayout?: (sizes: number[]) => void }) {
    return (
        <ResizablePanelGroup onLayout={onLayout}>
            <ResizablePanel data-testid="a" defaultSize={30} minSize={20} maxSize={60}>
                A
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel data-testid="b">B</ResizablePanel>
            <ResizableHandle aria-label="Resize C" />
            <ResizablePanel data-testid="c" minSize={10}>
                C
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}

const grow = (id: string) => screen.getByTestId(id).style.flexGrow;

describe('ResizablePanelGroup', () => {
    it('panels without a size share what the others leave', () => {
        render(<Split />);
        expect([grow('a'), grow('b'), grow('c')]).toEqual(['30', '35', '35']);
    });

    it('a handle is a focusable separator across the group, valued as the panel before it', () => {
        render(<Split />);
        const [first, second] = screen.getAllByRole('separator');
        expect(first).toHaveAccessibleName('Resize');
        expect(second).toHaveAccessibleName('Resize C');
        expect(first).toHaveAttribute('tabindex', '0');
        expect(first).toHaveAttribute('aria-orientation', 'vertical');
        expect(first).toHaveAttribute('aria-controls', screen.getByTestId('a').id);
        expect(first).toHaveAttribute('aria-valuenow', '30');
        expect(first).toHaveAttribute('aria-valuemin', '20');
        expect(first).toHaveAttribute('aria-valuemax', '60');
    });

    it('arrow keys move the boundary, within both panels’ limits; Home and End go to them', () => {
        const onLayout = vi.fn();
        render(<Split onLayout={onLayout} />);
        const [first, second] = screen.getAllByRole('separator');
        fireEvent.keyDown(first, { key: 'ArrowRight' });
        expect([grow('a'), grow('b')]).toEqual(['35', '30']);
        expect(onLayout).toHaveBeenLastCalledWith([35, 30, 35]);
        fireEvent.keyDown(first, { key: 'End' });
        expect(grow('a')).toBe('60');
        fireEvent.keyDown(first, { key: 'Home' });
        expect(grow('a')).toBe('20');
        // C can't go below 10, so B stops at what's left of the pair.
        fireEvent.keyDown(second, { key: 'End' });
        expect([grow('b'), grow('c')]).toEqual(['70', '10']);
    });

    it('stacked, the up and down arrows move it', () => {
        render(
            <ResizablePanelGroup orientation="vertical">
                <ResizablePanel data-testid="a">A</ResizablePanel>
                <ResizableHandle />
                <ResizablePanel data-testid="b">B</ResizablePanel>
            </ResizablePanelGroup>,
        );
        const handle = screen.getByRole('separator');
        expect(handle).toHaveAttribute('aria-orientation', 'horizontal');
        fireEvent.keyDown(handle, { key: 'ArrowDown' });
        expect(grow('a')).toBe('55');
        fireEvent.keyDown(handle, { key: 'ArrowRight' });
        expect(grow('a')).toBe('55');
    });

    it('dragging moves it by the pointer’s distance', () => {
        HTMLElement.prototype.setPointerCapture = () => {};
        render(<Split />);
        for (const id of ['a', 'b']) Object.defineProperty(screen.getByTestId(id), 'offsetWidth', { value: 325 });
        const [first] = screen.getAllByRole('separator');
        fireEvent.pointerDown(first, { button: 0, clientX: 300, pointerId: 1 });
        // The pair is 65% over 650px: 10px is 1%.
        fireEvent.pointerMove(first, { clientX: 400, pointerId: 1 });
        expect(grow('a')).toBe('40');
        expect(first).toHaveAttribute('data-active');
        fireEvent.pointerUp(first, { pointerId: 1 });
        expect(first).not.toHaveAttribute('data-active');
        fireEvent.pointerMove(first, { clientX: 500, pointerId: 1 });
        expect(grow('a')).toBe('40');
    });
});
