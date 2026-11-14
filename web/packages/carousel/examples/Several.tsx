import { Carousel, CarouselContent, CarouselControls, CarouselItem, CarouselNext, CarouselPrevious } from '@rinzai/zen';

const CATEGORIES = [
    { name: 'Groceries', spent: '$412', chart: 6 },
    { name: 'Rent', spent: '$1,600', chart: 7 },
    { name: 'Transport', spent: '$96', chart: 1 },
    { name: 'Eating out', spent: '$238', chart: 2 },
    { name: 'Subscriptions', spent: '$54', chart: 5 },
    { name: 'Health', spent: '$120', chart: 3 },
];

/**
 * Several slides in view: size the items (here a half, then a third on wider
 * screens). It snaps to each; the buttons sit together at the end, each gone when there's no further to go.
 */
export default function Several() {
    return (
        <Carousel aria-label="Spending by category" className="w-full max-w-xl">
            <CarouselContent className="gap-3">
                {CATEGORIES.map((c) => (
                    <CarouselItem key={c.name} className="basis-[calc(50%-0.375rem)] sm:basis-[calc(33.333%-0.5rem)]">
                        <div
                            className="border-tint/10 flex h-28 flex-col justify-end gap-0.5 rounded-xl border p-4"
                            style={{
                                // The chart palette, so each category looks as it does in charts.
                                background: `linear-gradient(160deg, color-mix(in oklch, var(--chart-${c.chart}) 35%, transparent), color-mix(in oklch, var(--chart-${c.chart}) 6%, transparent))`,
                            }}
                        >
                            <span className="text-muted-foreground text-xs">{c.name}</span>
                            <span className="text-lg font-semibold tabular-nums">{c.spent}</span>
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselControls className="justify-end">
                <CarouselPrevious />
                <CarouselNext />
            </CarouselControls>
        </Carousel>
    );
}
