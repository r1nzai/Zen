import { Button, ButtonGroup } from '@rinzai/zen';
import ChevronLeft from '@zen/icons/chevron-left';
import ChevronRight from '@zen/icons/chevron-right';

/** Previous, today and next, joined: one control for moving through months. */
export default function Default() {
    return (
        <ButtonGroup aria-label="Month">
            <Button variant="outline" size="icon" aria-label="Previous month">
                <ChevronLeft className="size-4 rtl:-scale-x-100" />
            </Button>
            <Button variant="outline">This month</Button>
            <Button variant="outline" size="icon" aria-label="Next month">
                <ChevronRight className="size-4 rtl:-scale-x-100" />
            </Button>
        </ButtonGroup>
    );
}
