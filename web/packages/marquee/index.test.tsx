import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

import Marquee from './index';

// jsdom lays nothing out: give the box and its text widths, and record the animations.
let boxWidth = 100;
let textWidth = 300;
let animations: { el: Element; cancel: ReturnType<typeof vi.fn> }[] = [];
const observers: ResizeObserverCallback[] = [];

beforeEach(() => {
    boxWidth = 100;
    textWidth = 300;
    animations = [];
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => boxWidth);
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(() => textWidth);
    Element.prototype.animate = vi.fn(function (this: Element) {
        const cancel = vi.fn();
        animations.push({ el: this, cancel });
        return { cancel } as unknown as Animation;
    });
    vi.stubGlobal(
        'ResizeObserver',
        class {
            constructor(callback: ResizeObserverCallback) {
                observers.push(callback);
            }
            observe() {}
            disconnect() {}
        },
    );
});

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

const box = () => screen.getByText('A long title').parentElement!;

describe('Marquee', () => {
    it('is the text, unchanged for assistive tech, and still while not hovered', () => {
        render(<Marquee className="text-sm">A long title</Marquee>);
        expect(box()).toHaveClass('zen__marquee', 'text-sm');
        expect(box()).toHaveTextContent('A long title');
        expect(animations).toHaveLength(0);
    });

    it('scrolls while hovered when the text overflows, and stops when left', () => {
        render(<Marquee>A long title</Marquee>);
        fireEvent.pointerEnter(box());
        expect(box()).toHaveAttribute('data-moving');
        expect(animations.some((a) => a.el === screen.getByText('A long title'))).toBe(true);
        fireEvent.pointerLeave(box());
        expect(box()).not.toHaveAttribute('data-moving');
        expect(animations.every((a) => a.cancel.mock.calls.length === 1)).toBe(true);
    });

    it("doesn't move text that fits", () => {
        textWidth = 80;
        render(<Marquee>A long title</Marquee>);
        fireEvent.pointerEnter(box());
        expect(animations).toHaveLength(0);
    });

    it('measures again when the box resizes', () => {
        textWidth = 80;
        render(<Marquee trigger="always">A long title</Marquee>);
        expect(animations).toHaveLength(0);
        boxWidth = 50;
        textWidth = 300;
        act(() => observers.at(-1)!([], {} as ResizeObserver));
        expect(box()).toHaveAttribute('data-moving');
    });

    it('moves with its host: hover or keyboard focus anywhere in it', () => {
        render(
            <a href="#x" data-zen-marquee-host data-testid="row">
                <Marquee>A long title</Marquee>
            </a>,
        );
        fireEvent.pointerEnter(screen.getByTestId('row'));
        expect(box()).toHaveAttribute('data-moving');
    });

    it('keeps moving with trigger="always"', () => {
        render(<Marquee trigger="always">A long title</Marquee>);
        expect(box()).toHaveAttribute('data-moving');
    });

    it('stays an ellipsis with reduced motion', () => {
        vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce') }) as MediaQueryList);
        render(<Marquee trigger="always">A long title</Marquee>);
        expect(animations).toHaveLength(0);
        expect(box()).not.toHaveAttribute('data-moving');
    });
});
