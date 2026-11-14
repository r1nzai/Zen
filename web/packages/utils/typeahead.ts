import { useRef } from 'react';

/**
 * Type to jump, as in a native list: keys typed quickly in a row search
 * together. Returns what's been typed so far (lower case) when the key is a
 * letter or digit, else null; match it against the start of each item's label.
 */
export function useTypeahead(): (e: {
    key: string;
    ctrlKey: boolean;
    metaKey: boolean;
    altKey: boolean;
}) => string | null {
    const typed = useRef({ text: '', at: 0 });
    return (e) => {
        if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return null;
        const now = Date.now();
        const text = (now - typed.current.at < 700 ? typed.current.text : '') + e.key.toLowerCase();
        typed.current = { text, at: now };
        return text;
    };
}
