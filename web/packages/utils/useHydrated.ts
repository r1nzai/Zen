import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/** False during server rendering and the hydration render, true afterwards: for client-only UI. */
export function useHydrated(): boolean {
    return useSyncExternalStore(
        subscribe,
        () => true,
        () => false,
    );
}
