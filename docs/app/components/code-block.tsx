import { CodeBlock as ZenCodeBlock } from '@rinzai/zen';
import { highlight } from 'sugar-high';

type Lang = 'typescript' | 'shell' | 'css';

/** Zen's CodeBlock, coloured by sugar-high. */
export function CodeBlock({ code, lang = 'typescript', className }: { code: string; lang?: Lang; className?: string }) {
    return (
        <ZenCodeBlock
            code={code}
            language={lang}
            highlight={(c, language) => highlight(c, { lang: language as Lang })}
            className={className}
        />
    );
}

/** A code block on a glass panel, for installation and usage snippets. */
export function CodeCard(props: { code: string; lang?: Lang }) {
    return (
        <div className="glass overflow-hidden rounded-xl">
            <CodeBlock {...props} />
        </div>
    );
}
