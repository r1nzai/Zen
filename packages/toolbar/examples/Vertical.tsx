import { Button, Toolbar, ToolbarSeparator, ToggleGroup, ToggleGroupItem } from '@rinzai/zen';
import ChartBar from '@zen/icons/chart-bar';
import MinusMicro from '@zen/icons/micro/minus';
import PlusMicro from '@zen/icons/micro/plus';
import Squares from '@zen/icons/squares';

/** Upright beside what it controls, e.g. a chart: ↑↓ move through it, and its toggle group stacks too. */
export default function Vertical() {
    return (
        <Toolbar aria-label="Chart" orientation="vertical">
            <Button variant="ghost" size="icon-sm" aria-label="Zoom in">
                <PlusMicro />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Zoom out">
                <MinusMicro />
            </Button>
            <ToolbarSeparator />
            <ToggleGroup aria-label="Chart type" defaultValue="bars">
                <ToggleGroupItem value="bars" aria-label="Bars" className="px-2">
                    <ChartBar className="size-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="tiles" aria-label="Tiles" className="px-2">
                    <Squares className="size-4" />
                </ToggleGroupItem>
            </ToggleGroup>
        </Toolbar>
    );
}
