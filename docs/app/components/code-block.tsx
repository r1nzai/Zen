import { Button, cx, useToast } from '@rinzai/zen';
import { highlight } from 'sugar-high';

/** Highlighted code with a copy button. */
export function CodeBlock({
    code,
    lang = 'typescript',
    className,
}: {
    code: string;
    lang?: 'typescript' | 'shell' | 'css';
    className?: string;
}) {
    const toast = useToast();
    return (
        <div className={cx('group relative', className)}>
            <pre className="code m-0! overflow-x-auto rounded-none! bg-transparent! p-5! text-[13px]! leading-6 font-normal!">
                <code
                    className="bg-transparent! p-0! text-inherit!"
                    dangerouslySetInnerHTML={{ __html: highlight(code.trim(), { lang }) }}
                />
            </pre>
            <Button
                variant="ghost"
                size="sm"
                className="absolute top-2.5 right-2.5 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                onClick={async () => {
                    await navigator.clipboard.writeText(code.trim());
                    toast('Copied', { tone: 'success', timeout: 1500 });
                }}
            >
                Copy
            </Button>
        </div>
    );
}

/** A code block in a glass card, for installation and usage snippets. */
export function CodeCard(props: { code: string; lang?: 'typescript' | 'shell' | 'css' }) {
    return (
        <div className="glass overflow-hidden rounded-xl">
            <CodeBlock {...props} />
        </div>
    );
}
