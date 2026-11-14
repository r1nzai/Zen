import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { useCopyToClipboard } from './useCopyToClipboard';

// jsdom has no Clipboard API, so each test that needs one adds it.
function stubClipboard(writeText: (text: string) => Promise<void>) {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
}

describe('useCopyToClipboard', () => {
    afterEach(() => {
        Reflect.deleteProperty(navigator, 'clipboard');
        vi.useRealTimers();
    });

    it('copies, and is copied until resetAfter has passed', async () => {
        vi.useFakeTimers();
        const writeText = vi.fn().mockResolvedValue(undefined);
        stubClipboard(writeText);
        const { result } = renderHook(() => useCopyToClipboard());
        expect(result.current.copied).toBe(false);
        await act(async () => expect(await result.current.copy('hello')).toBe(true));
        expect(writeText).toHaveBeenCalledWith('hello');
        expect(result.current.copied).toBe(true);
        act(() => {
            vi.advanceTimersByTime(1499);
        });
        expect(result.current.copied).toBe(true);
        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(result.current.copied).toBe(false);
    });

    it('starts the countdown again on another copy', async () => {
        vi.useFakeTimers();
        stubClipboard(vi.fn().mockResolvedValue(undefined));
        const { result } = renderHook(() => useCopyToClipboard({ resetAfter: 3000 }));
        await act(() => result.current.copy('a'));
        act(() => {
            vi.advanceTimersByTime(2000);
        });
        await act(() => result.current.copy('b'));
        act(() => {
            vi.advanceTimersByTime(2999);
        });
        expect(result.current.copied).toBe(true);
        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(result.current.copied).toBe(false);
    });

    it('resolves false without a Clipboard API', async () => {
        const { result } = renderHook(() => useCopyToClipboard());
        await act(async () => expect(await result.current.copy('hello')).toBe(false));
        expect(result.current.copied).toBe(false);
    });

    it('resolves false when the browser refuses, and is no longer copied', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        stubClipboard(writeText);
        const { result } = renderHook(() => useCopyToClipboard());
        await act(() => result.current.copy('a'));
        expect(result.current.copied).toBe(true);
        writeText.mockRejectedValue(new DOMException('Write permission denied.', 'NotAllowedError'));
        await act(async () => expect(await result.current.copy('b')).toBe(false));
        expect(result.current.copied).toBe(false);
    });

    it('follows the latest copy when an earlier one settles after it', async () => {
        let refuse: (reason: Error) => void = () => {};
        const writeText = vi
            .fn()
            .mockReturnValueOnce(new Promise((_, reject) => (refuse = reject)))
            .mockResolvedValueOnce(undefined);
        stubClipboard(writeText);
        const { result } = renderHook(() => useCopyToClipboard());
        const first = result.current.copy('a');
        await act(() => result.current.copy('b'));
        refuse(new DOMException('Write permission denied.', 'NotAllowedError'));
        await act(async () => expect(await first).toBe(false));
        expect(result.current.copied).toBe(true);
    });

    it('keeps the same copy function across renders', () => {
        const { result, rerender } = renderHook(() => useCopyToClipboard());
        const { copy } = result.current;
        rerender();
        expect(result.current.copy).toBe(copy);
    });

    it('leaves no timer behind when unmounted', async () => {
        vi.useFakeTimers();
        stubClipboard(vi.fn().mockResolvedValue(undefined));
        const { result, unmount } = renderHook(() => useCopyToClipboard());
        await act(() => result.current.copy('a'));
        expect(vi.getTimerCount()).toBe(1);
        unmount();
        expect(vi.getTimerCount()).toBe(0);
    });
});
