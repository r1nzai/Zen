import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Copies text to the clipboard. `copied` is true for `resetAfter` ms after a copy that worked; `copy`
 * resolves false when nothing was copied (no Clipboard API, an insecure page, a denied permission).
 */
export function useCopyToClipboard({ resetAfter = 1500 }: CopyToClipboardOptions = {}) {
    // A new object per copy, so copying again restarts the countdown.
    const [lastCopy, setLastCopy] = useState<object | null>(null);
    useEffect(() => {
        if (!lastCopy) return;
        const timer = setTimeout(() => setLastCopy(null), resetAfter);
        return () => clearTimeout(timer);
    }, [lastCopy, resetAfter]);

    const latest = useRef(0);
    const copy = useCallback(async (text: string) => {
        const id = ++latest.current;
        let ok = true;
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            ok = false;
        }
        // A copy that settles after a newer one doesn't override it.
        if (id === latest.current) setLastCopy(ok ? {} : null);
        return ok;
    }, []);

    return { copy, copied: lastCopy !== null };
}

export interface CopyToClipboardOptions {
    /** How long `copied` stays true after a copy, in ms. */
    resetAfter?: number;
}
