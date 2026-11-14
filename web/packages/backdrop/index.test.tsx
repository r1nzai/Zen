import { render } from '@testing-library/react';

import Card from '../card';
import Backdrop from './index';

describe('Backdrop', () => {
    let frames: FrameRequestCallback[] = [];
    const step = (time: number) => {
        const due = frames;
        frames = [];
        due.forEach((cb) => cb(time));
    };
    beforeEach(() => {
        frames = [];
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => frames.push(cb));
    });
    afterEach(() => {
        vi.restoreAllMocks();
        document.documentElement.style.removeProperty('--glow-trail');
    });

    const light = (container: HTMLElement) => {
        const el = container.querySelector<HTMLElement>('.zen-light')!;
        return [parseFloat(el.style.left), parseFloat(el.style.top)];
    };

    it('trails the pointer by --glow-trail, lighting edges from where the light is', () => {
        document.documentElement.style.setProperty('--glow-trail', '90ms');
        const { container } = render(
            <>
                <Backdrop />
                <Card>lit</Card>
            </>,
        );
        // Coming in, the light starts at the pointer rather than sliding in from off-screen.
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 0, clientY: 0 }));
        step(0);
        expect(light(container)).toEqual([0, 0]);

        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 0 }));
        step(16);
        const [x] = light(container);
        expect(x).toBeGreaterThan(0);
        expect(x).toBeLessThan(100);
        expect(container.querySelector<HTMLElement>('.glow-edge')!.style.getPropertyValue('--gx')).toBe(`${x}px`);

        // It keeps going until it settles on the pointer, then stops asking for frames.
        for (let t = 32; frames.length && t < 5000; t += 16) step(t);
        expect(light(container)).toEqual([100, 0]);
        expect(frames).toHaveLength(0);
    });

    it('leaves the edges lit where they were when the pointer goes, for CSS to fade', () => {
        const { container } = render(
            <>
                <Backdrop />
                <Card>lit</Card>
            </>,
        );
        const root = document.documentElement;
        const edge = container.querySelector<HTMLElement>('.glow-edge')!;
        expect(root.dataset.zenPointer).toBe('out');
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 10, clientY: 20 }));
        step(0);
        expect(root.dataset.zenPointer).toBe('in');
        const lit = edge.style.getPropertyValue('--gx');
        root.dispatchEvent(new PointerEvent('pointerleave'));
        step(16);
        expect(root.dataset.zenPointer).toBe('out');
        expect(edge.style.getPropertyValue('--gx')).toBe(lit);
    });

    it('follows exactly at 0ms', () => {
        document.documentElement.style.setProperty('--glow-trail', '0ms');
        const { container } = render(<Backdrop />);
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 0, clientY: 0 }));
        step(0);
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 40 }));
        step(16);
        expect(light(container)).toEqual([100, 40]);
    });
});
