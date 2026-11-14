import { Avatar, HoverCard, HoverCardContent, HoverCardTrigger } from '@rinzai/zen';

/** Rest the pointer on the name, or tab to it: a preview of who it is. */
export default function Default() {
    return (
        <p className="mt-0! text-sm">
            Paid to{' '}
            <HoverCard>
                <HoverCardTrigger href="#priya">Priya Sharma</HoverCardTrigger>
                <HoverCardContent className="flex gap-3">
                    <Avatar name="Priya Sharma" />
                    <div className="flex flex-col gap-1">
                        <span className="font-medium">Priya Sharma</span>
                        <span className="text-muted-foreground text-xs">Flatmate · shares rent and bills</span>
                        <span className="text-muted-foreground mt-1 text-xs tabular-nums">
                            12 payments this year, $4,210 in all
                        </span>
                    </div>
                </HoverCardContent>
            </HoverCard>{' '}
            on 3 October.
        </p>
    );
}
