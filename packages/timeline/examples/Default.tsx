import { Timeline, TimelineItem } from '@rinzai/zen';

/** An entry's history, newest first; the latest is lit. */
export default function Default() {
    return (
        <Timeline className="w-full max-w-sm">
            <TimelineItem active title="Paid" time="Today, 09:12">
                $1,850 to Northside Lettings.
            </TimelineItem>
            <TimelineItem title="Amount changed" time="3 Sep">
                From $1,800 to $1,850.
            </TimelineItem>
            <TimelineItem title="Created" time="1 Aug" />
        </Timeline>
    );
}
