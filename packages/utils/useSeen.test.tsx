import { act, render } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { useSeen } from './useSeen';

function Probe() {
    const ref = useRef<HTMLDivElement>(null);
    return <div ref={ref} data-seen={useSeen(ref)} />;
}

describe('useSeen', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('turns true once the element is on screen, and stays true', () => {
        let report: (entries: { isIntersecting: boolean }[]) => void = () => {};
        const disconnect = vi.fn();
        vi.stubGlobal(
            'IntersectionObserver',
            class {
                constructor(cb: typeof report) {
                    report = cb;
                }
                observe() {}
                disconnect = disconnect;
            },
        );
        const { container } = render(<Probe />);
        const el = container.firstElementChild!;
        expect(el.getAttribute('data-seen')).toBe('false');
        act(() => report([{ isIntersecting: true }]));
        expect(el.getAttribute('data-seen')).toBe('true');
        expect(disconnect).toHaveBeenCalled();
    });

    it('is true straight away without IntersectionObserver', () => {
        vi.stubGlobal('IntersectionObserver', undefined);
        const { container } = render(<Probe />);
        expect(container.firstElementChild!.getAttribute('data-seen')).toBe('true');
    });
});
