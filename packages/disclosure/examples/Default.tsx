import { Card, CardHeader, CardTitle, Disclosure, DisclosureContent, DisclosureTrigger, Meter } from '@rinzai/zen';

const ACTIVE = [
    { name: 'New phone', saved: 42000, target: 60000 },
    { name: 'Emergency fund', saved: 180000, target: 300000 },
];
const PAST = ['Laptop', 'Trip to Goa', 'Wedding gift'];

/** Finished goals folded away under the active ones; the section grows open and folds shut. */
export default function Default() {
    return (
        <Card className="w-full max-w-sm gap-4">
            <CardHeader>
                <CardTitle>Goals</CardTitle>
            </CardHeader>
            <ul className="flex flex-col gap-3 text-sm">
                {ACTIVE.map((g) => (
                    <li key={g.name} className="flex flex-col gap-1.5">
                        <div className="flex justify-between">
                            <span>{g.name}</span>
                            <span className="text-muted-foreground tabular-nums">
                                {Math.round((g.saved / g.target) * 100)}%
                            </span>
                        </div>
                        <Meter value={g.saved} max={g.target} aria-label={g.name} />
                    </li>
                ))}
            </ul>
            <Disclosure>
                <DisclosureTrigger>Past ({PAST.length})</DisclosureTrigger>
                <DisclosureContent>
                    <ul className="border-tint/[0.07] flex flex-col gap-2 border-l pl-4 text-sm">
                        {PAST.map((g) => (
                            <li key={g} className="text-muted-foreground flex items-center justify-between">
                                {g}
                                <span className="text-xs">Done</span>
                            </li>
                        ))}
                    </ul>
                </DisclosureContent>
            </Disclosure>
        </Card>
    );
}
