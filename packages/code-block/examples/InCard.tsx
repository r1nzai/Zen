import { Card, CodeBlock } from '@rinzai/zen';

/** Inside a card or panel that already has a surface, `variant="plain"` drops the block's own. */
export default function InCard() {
    return (
        <Card
            title="Install"
            className="w-full max-w-xl overflow-hidden p-0! [&>header]:mb-0 [&>header]:px-5 [&>header]:pt-5"
        >
            <CodeBlock variant="plain" code="pnpm add @rinzai/zen" language="shell" />
        </Card>
    );
}
