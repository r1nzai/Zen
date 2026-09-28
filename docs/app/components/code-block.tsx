import { CodeBlock as ZenCodeBlock } from '@rinzai/zen';
import { highlight } from 'sugar-high';

type Lang = 'typescript' | 'shell' | 'css';

/** Zen's CodeBlock, coloured by sugar-high. */
export function CodeBlock({
    code,
    lang = 'typescript',
    variant,
    className,
}: {
    code: string;
    lang?: Lang;
    variant?: 'glass' | 'plain';
    className?: string;
}) {
    return (
        <ZenCodeBlock
            code={code}
            language={lang}
            variant={variant}
            highlight={(c, language) => highlight(c, { lang: language as Lang })}
            className={className}
        />
    );
}

/** A code block on its own lit glass panel, for installation and usage snippets. */
export function CodeCard(props: { code: string; lang?: Lang }) {
    return <CodeBlock {...props} />;
}
