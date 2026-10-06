import { Kbd } from '@rinzai/zen';

/** Shortcuts in a sentence: each key its own Kbd. */
export default function Default() {
    return (
        <p className="text-muted-foreground mt-0! flex flex-wrap items-center gap-1 text-sm">
            Search with <Kbd>⌘</Kbd>
            <Kbd>K</Kbd> on a Mac, <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd> elsewhere; close with <Kbd>Esc</Kbd>.
        </p>
    );
}
