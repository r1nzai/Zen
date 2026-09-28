import { Badge } from '@rinzai/zen';

export default function Variants() {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <Badge>New</Badge>
            <Badge variant="secondary">Draft</Badge>
            <Badge variant="destructive">Overdue</Badge>
            <Badge variant="outline">Archived</Badge>
        </div>
    );
}
