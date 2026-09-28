import { CodeBlock } from '@rinzai/zen';

export default function Plain() {
    return (
        <div className="glass w-full max-w-xl overflow-hidden rounded-xl">
            <CodeBlock code="pnpm add @rinzai/zen" language="shell" />
        </div>
    );
}
