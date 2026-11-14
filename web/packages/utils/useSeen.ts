import { RefObject, useEffect, useState } from 'react';

/** True once the element has been on screen; it stays true. */
export function useSeen(ref: RefObject<Element | null>): boolean {
    const [seen, setSeen] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (seen || !el) return;
        if (typeof IntersectionObserver === 'undefined') return setSeen(true);
        const observer = new IntersectionObserver((entries) => {
            if (entries.some((e) => e.isIntersecting)) setSeen(true);
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, [ref, seen]);
    return seen;
}
