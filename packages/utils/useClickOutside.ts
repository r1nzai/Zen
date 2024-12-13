import { RefObject } from 'react';

export default function useClickOutside<TElement extends HTMLElement>(
    ref: RefObject<TElement>,
    handler: (outside: boolean) => void,
) {
    return () => {
        if (typeof document === 'undefined') {
            return;
        }
        const listener = (event: MouseEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) {
                return;
            }
            handler(true);
        };
        document.addEventListener('mousedown', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
        };
    };
}
