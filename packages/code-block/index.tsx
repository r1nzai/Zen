import { cx } from '@zen/utils/cx';
import { ComponentProps, useEffect, useState } from 'react';

/**
 * Code on a glass panel whose edge catches the pointer light, with a copy
 * button. Zen ships no highlighter: pass `highlight` (code → HTML string, e.g.
 * sugar-high's `highlight`) for colours.
 */
export default function CodeBlock({
    code,
    language,
    highlight,
    copyable = true,
    variant = 'glass',
    className,
    ...rest
}: CodeBlockProps) {
    const text = code.trim();
    const [copied, setCopied] = useState(false);
    useEffect(() => {
        if (!copied) return;
        const t = setTimeout(() => setCopied(false), 1500);
        return () => clearTimeout(t);
    }, [copied]);

    return (
        <div
            className={cx(
                'zen__code-block group relative',
                variant === 'glass' && 'glass glow-edge overflow-hidden rounded-xl',
                className,
            )}
            data-language={language}
            {...rest}
        >
            <pre className="text-foreground m-0! overflow-x-auto rounded-none! bg-transparent! p-5! font-mono text-[13px]! leading-6 font-normal!">
                {highlight ? (
                    <code
                        className="bg-transparent! p-0! text-inherit!"
                        dangerouslySetInnerHTML={{ __html: highlight(text, language) }}
                    />
                ) : (
                    <code className="bg-transparent! p-0! text-inherit!">{text}</code>
                )}
            </pre>
            {copyable && (
                <button
                    type="button"
                    onClick={async () => {
                        await navigator.clipboard?.writeText(text);
                        setCopied(true);
                    }}
                    className={cx(
                        'zen__code-copy text-muted-foreground hover:bg-tint/[0.07] hover:text-foreground focus-visible:ring-ring/50 absolute top-2.5 right-2.5 cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium outline-hidden transition-[opacity,background-color,color] focus-visible:ring-2',
                        'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
                        copied && 'text-primary opacity-100',
                    )}
                >
                    {copied ? 'Copied' : 'Copy'}
                </button>
            )}
        </div>
    );
}

export interface CodeBlockProps extends Omit<ComponentProps<'div'>, 'children'> {
    code: string;
    /** Passed to `highlight`, and set as data-language. */
    language?: string;
    /** Turns the code into HTML with coloured tokens. Without it, plain text. */
    highlight?: (code: string, language?: string) => string;
    /** Show the copy button (on hover and focus). */
    copyable?: boolean;
    /** `glass` (default): its own lit glass panel. `plain`: no surface, for code inside a card or panel. */
    variant?: 'glass' | 'plain';
}
