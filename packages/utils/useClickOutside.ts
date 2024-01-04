import { RefObject } from 'react';

export default function useClickOutside(ref: RefObject<any>, handler: (outside: boolean) => void): void | (() => void) {
    const listener = (event: MouseEvent) => {
        if (!ref.current || ref.current.contains(event.target)) {
            return;
        }
        handler(true);
    };
    document.addEventListener('mousedown', listener);
    return () => {
        document.removeEventListener('mousedown', listener);
    };
}
