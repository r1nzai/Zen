import { CodeBlock } from '@rinzai/zen';

/** Without a highlighter, the code shows as plain text. */
export default function Plain() {
    return <CodeBlock code="pnpm add @rinzai/zen" language="shell" className="w-full max-w-xl" />;
}
