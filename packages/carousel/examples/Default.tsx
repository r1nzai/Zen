import {
    Card,
    Carousel,
    CarouselContent,
    CarouselControls,
    CarouselDots,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    ProgressRing,
} from '@rinzai/zen';

const GOALS = [
    { name: 'Emergency fund', saved: 6400, target: 10000 },
    { name: 'New laptop', saved: 1150, target: 1800 },
    { name: 'Trip to Kyoto', saved: 2100, target: 4500 },
    { name: 'Wedding gift', saved: 300, target: 300 },
];

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

/** One slide at a time, with buttons and dots below. Swipe or scroll it too, or focus it and use the arrow keys. */
export default function Default() {
    return (
        <Carousel aria-label="Savings goals" className="w-full max-w-sm">
            <CarouselContent>
                {GOALS.map((goal) => (
                    <CarouselItem key={goal.name}>
                        <Card className="flex items-center gap-5">
                            <ProgressRing value={goal.saved / goal.target} label={goal.name}>
                                <span className="text-sm font-semibold tabular-nums">
                                    {Math.round((goal.saved / goal.target) * 100)}%
                                </span>
                            </ProgressRing>
                            <div className="flex min-w-0 flex-col gap-1">
                                <span className="truncate font-medium">{goal.name}</span>
                                <span className="text-muted-foreground text-sm tabular-nums">
                                    {usd.format(goal.saved)} of {usd.format(goal.target)}
                                </span>
                            </div>
                        </Card>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselControls>
                <CarouselPrevious />
                <CarouselDots />
                <CarouselNext />
            </CarouselControls>
        </Carousel>
    );
}
