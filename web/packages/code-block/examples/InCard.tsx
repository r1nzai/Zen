import { Card, CardHeader, CardTitle, CodeBlock } from '@rinzai/zen';

/** Inside a card or panel that already has a surface, `variant="plain"` drops the block's own. */
export default function InCard() {
    return (
        <Card className="w-full max-w-xl overflow-hidden p-0!">
            <CardHeader className="mb-0 px-5 pt-5">
                <CardTitle>Install</CardTitle>
            </CardHeader>
            <CodeBlock variant="plain" code="pnpm add @rinzai/zen" language="shell" />
        </Card>
    );
}
