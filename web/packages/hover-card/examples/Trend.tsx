import { HoverCard, HoverCardContent, HoverCardTrigger, Sparkline } from '@rinzai/zen';

const MERCHANTS = [
    { name: 'Corner Market', spent: [120, 96, 140, 118, 152, 131], total: '$757' },
    { name: 'City Transit', spent: [64, 70, 58, 66, 61, 72], total: '$391' },
];

/** More than a name: each merchant's spending over six months, a glance away. */
export default function Trend() {
    return (
        <ul className="flex flex-col gap-2 text-sm">
            {MERCHANTS.map((m) => (
                <li key={m.name}>
                    <HoverCard>
                        <HoverCardTrigger href={`#${m.name}`}>{m.name}</HoverCardTrigger>
                        <HoverCardContent className="flex w-56 flex-col gap-2">
                            <div className="flex items-baseline justify-between">
                                <span className="font-medium">{m.name}</span>
                                <span className="text-muted-foreground text-xs tabular-nums">{m.total}</span>
                            </div>
                            <Sparkline
                                values={m.spent}
                                area
                                className="h-10 w-full"
                                aria-label={`${m.name}, last six months`}
                            />
                            <span className="text-muted-foreground text-xs">Last six months</span>
                        </HoverCardContent>
                    </HoverCard>
                </li>
            ))}
        </ul>
    );
}
