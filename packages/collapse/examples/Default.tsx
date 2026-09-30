import { Badge, Collapse } from '@rinzai/zen';

const TAGS = ['Groceries', 'Rent', 'Transport', 'Dining out', 'Subscriptions', 'Travel', 'Gifts', 'Health', 'Books'];

/** Shows as many tags as fit on one line, and the rest behind "+N". Resize the window to see it adapt. */
export default function Default() {
    return (
        <Collapse items={TAGS} className="w-full max-w-md gap-1">
            {(tag) => <Badge variant="secondary">{tag}</Badge>}
        </Collapse>
    );
}
