import { cx } from '@rinzai/zen';
import { Fragment } from 'react';

import { CodeBlock } from './code-block';

/** `code` spans as <code>, the rest as text. */
function Inline({ text }: { text: string }) {
    return text.split(/(`[^`]+`)/).map((part, i) =>
        part.startsWith('`') && part.endsWith('`') && part.length > 2 ? (
            <code key={i} className="text-foreground text-[0.9em]">
                {part.slice(1, -1)}
            </code>
        ) : (
            <Fragment key={i}>{part}</Fragment>
        ),
    );
}

/**
 * JSDoc text as the docs show it: paragraphs split by blank lines (a single
 * line break is just a wrap), indented lines as a code block, and `code` spans.
 */
export function DocText({ text, className }: { text: string; className?: string }) {
    const blocks: { code: boolean; lines: string[] }[] = [];
    for (const line of text.split('\n')) {
        const code = /^\s{2,}\S/.test(line);
        const last = blocks.at(-1);
        if (!line.trim()) {
            // A blank line ends a paragraph; inside code it's kept.
            if (last?.code) last.lines.push('');
            else if (last?.lines.length) blocks.push({ code: false, lines: [] });
        } else if (last && last.code === code) last.lines.push(line);
        else blocks.push({ code, lines: [line] });
    }
    return blocks
        .filter((b) => b.lines.some((l) => l.trim()))
        .map((b, i) => {
            if (b.code) {
                const indent = Math.min(...b.lines.filter((l) => l.trim()).map((l) => l.search(/\S/)));
                const code = b.lines
                    .map((l) => l.slice(indent))
                    .join('\n')
                    .trimEnd();
                return <CodeBlock key={i} code={code} variant="plain" className="my-2 text-xs" />;
            }
            return (
                <p key={i} className={cx('text-muted-foreground', className)}>
                    <Inline text={b.lines.map((l) => l.trim()).join(' ')} />
                </p>
            );
        });
}
