import { act, render, screen } from '@testing-library/react';

import AnimatedNumber, { AnimatedMoney } from './index';

describe('AnimatedNumber', () => {
    it('shows the value at once with reduced motion', () => {
        document.documentElement.classList.add('reduce-motion');
        const { rerender } = render(<AnimatedNumber value={1200} format={(v) => `#${v}`} />);
        expect(screen.getByText('#1200')).toBeInTheDocument();
        rerender(<AnimatedNumber value={50} format={(v) => `#${v}`} />);
        expect(screen.getByText('#50')).toBeInTheDocument();
        document.documentElement.classList.remove('reduce-motion');
    });

    it('counts up in whole steps and lands on the value', async () => {
        const frames: FrameRequestCallback[] = [];
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => frames.push(cb));
        const now = vi.spyOn(performance, 'now').mockReturnValue(0);
        render(<AnimatedNumber value={1000} duration={100} />);
        expect(screen.getByText('0')).toBeInTheDocument();
        act(() => frames.shift()!(50));
        const mid = Number(screen.getByText(/^\d+$/).textContent);
        expect(mid).toBeGreaterThan(0);
        expect(mid).toBeLessThan(1000);
        expect(Number.isInteger(mid)).toBe(true);
        act(() => frames.shift()!(100));
        expect(screen.getByText('1000')).toBeInTheDocument();
        now.mockRestore();
        vi.restoreAllMocks();
    });

    it('formats money', () => {
        document.documentElement.classList.add('reduce-motion');
        render(<AnimatedMoney value={15200000} currency="INR" locale="en-IN" />);
        expect(screen.getByText('₹1,52,000')).toBeInTheDocument();
        document.documentElement.classList.remove('reduce-motion');
    });
});
