import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { useControllable } from './useControllable';

describe('useControllable', () => {
    it('keeps its own value from defaultValue when uncontrolled', () => {
        const onChange = vi.fn();
        const { result } = renderHook(() => useControllable<string | undefined>(undefined, 'a', onChange));
        expect(result.current[0]).toBe('a');
        act(() => result.current[1]('b'));
        expect(result.current[0]).toBe('b');
        expect(onChange).toHaveBeenCalledWith('b');
    });

    it('follows value when controlled, null included', () => {
        const onChange = vi.fn();
        const { result } = renderHook(() => useControllable<string | null>(null, 'a', onChange));
        expect(result.current[0]).toBeNull();
        act(() => result.current[1]('b'));
        expect(result.current[0]).toBeNull();
        expect(onChange).toHaveBeenCalledWith('b');
    });
});
