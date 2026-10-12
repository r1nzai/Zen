import { Button, Toolbar, ToolbarSeparator, ToggleGroup, ToggleGroupItem } from '@rinzai/zen';
import ChartBar from '@zen/icons/chart-bar';
import ListBullet from '@zen/icons/list-bullet';
import Settings from '@zen/icons/settings';
import Table from '@zen/icons/table';

/** A table's controls: one stop for Tab, and ←→ through them all, the toggle group's items too. */
export default function Default() {
    return (
        <Toolbar aria-label="Entries">
            <ToggleGroup aria-label="View" defaultValue="table">
                <ToggleGroupItem value="table" aria-label="Table" className="px-2">
                    <Table className="size-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="List" className="px-2">
                    <ListBullet className="size-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="chart" aria-label="Chart" className="px-2">
                    <ChartBar className="size-4" />
                </ToggleGroupItem>
            </ToggleGroup>
            <ToolbarSeparator />
            <Button variant="ghost" size="sm">
                Filter
            </Button>
            <Button variant="ghost" size="sm">
                Sort
            </Button>
            <ToolbarSeparator />
            <Button variant="ghost" size="icon-sm" aria-label="Table settings">
                <Settings className="size-4" />
            </Button>
        </Toolbar>
    );
}
