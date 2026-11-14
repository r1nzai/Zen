import { CodeBlock } from '@rinzai/zen';
import { highlight } from 'sugar-high';

const CODE = `import { Button } from '@rinzai/zen';

export default function Save() {
    return <Button loading>Saving…</Button>;
}`;

/** Colours come from any highlighter that turns code into HTML; here sugar-high. Hover to copy. */
export default function Highlighted() {
    return (
        <CodeBlock
            code={CODE}
            language="typescript"
            highlight={(code) => highlight(code)}
            className="w-full max-w-xl"
        />
    );
}
