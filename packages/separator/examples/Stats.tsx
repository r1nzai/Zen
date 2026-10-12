import { Card, Separator } from '@rinzai/zen';

/** Upright between figures in a card: it takes the row's height, so it spans each label and value. */
export default function Stats() {
    return (
        <Card className="flex w-full max-w-md items-stretch justify-between gap-4 py-4">
            {[
                ['Income', '$6,200'],
                ['Spent', '$4,180'],
                ['Saved', '$2,020'],
            ].map(([label, value], i) => (
                <div key={label} className="contents">
                    {i > 0 && <Separator orientation="vertical" decorative />}
                    <div className="flex flex-1 flex-col gap-1">
                        <span className="text-muted-foreground text-xs">{label}</span>
                        <span className="text-lg font-semibold tabular-nums">{value}</span>
                    </div>
                </div>
            ))}
        </Card>
    );
}
