import { Badge, Collapse } from '@rinzai/zen';
import { useRef } from 'react';

const TAGS = ['Groceries', 'Rent', 'Transport', 'Dining out', 'Subscriptions', 'Travel', 'Gifts', 'Health', 'Books'];

/** Shows as many tags as fit on one line, and the rest behind "+N". Resize the window to see it adapt. */
export default function Default() {
    const parentRef = useRef<HTMLDivElement>(null);
    return (
        <div ref={parentRef} className="flex w-full max-w-md items-center gap-1">
            <Collapse items={TAGS} parentRef={parentRef}>
                {(tag) => (
                    <Badge key={tag} variant="secondary">
                        {tag}
                    </Badge>
                )}
            </Collapse>
        </div>
    );
}
