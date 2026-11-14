import { Card, CardDescription, CardHeader, CardTitle, Inset } from '@rinzai/zen';

/** Tiles for single figures inside a card, and a tinted panel for a result. */
export default function Default() {
    return (
        <Card className="flex w-full max-w-sm flex-col gap-4">
            <CardHeader className="mb-0">
                <div className="min-w-0">
                    <CardTitle>Car loan</CardTitle>
                    <CardDescription>$32,000 at 8.5% · 5 years</CardDescription>
                </div>
            </CardHeader>
            <dl className="grid grid-cols-2 gap-3 text-sm">
                <Inset className="flex flex-col gap-0.5">
                    <dt className="text-muted-foreground text-xs">Next payment</dt>
                    <dd className="font-medium tabular-nums">$656</dd>
                </Inset>
                <Inset tone="positive" className="flex flex-col gap-0.5">
                    <dt className="text-muted-foreground text-xs">Debt-free</dt>
                    <dd className="font-medium">Mar 2031</dd>
                </Inset>
            </dl>
            <Inset bordered tone="positive" className="text-sm" role="status">
                Paying $200 more a month saves <strong>$2,140</strong> in interest.
            </Inset>
        </Card>
    );
}
