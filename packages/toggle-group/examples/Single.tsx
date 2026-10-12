import { ToggleGroup, ToggleGroupItem } from '@rinzai/zen';
import ChartBar from '@zen/icons/chart-bar';
import ListBullet from '@zen/icons/list-bullet';
import Squares from '@zen/icons/squares';

/** At most one: pressing the pressed one releases it. Icon-only items carry an aria-label. */
export default function Single() {
    return (
        <ToggleGroup aria-label="Group by" defaultValue="list">
            <ToggleGroupItem value="list" aria-label="As a list" className="px-2">
                <ListBullet className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="cards" aria-label="As cards" className="px-2">
                <Squares className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="chart" aria-label="As a chart" className="px-2">
                <ChartBar className="size-4" />
            </ToggleGroupItem>
        </ToggleGroup>
    );
}
