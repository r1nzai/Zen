import { Button } from '@rinzai/zen';

export default function Variants() {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <Button>Save changes</Button>
            <Button variant="secondary">Export</Button>
            <Button variant="outline">Cancel</Button>
            <Button variant="ghost">Skip</Button>
            <Button variant="destructive">Delete</Button>
            <Button variant="link">Learn more</Button>
        </div>
    );
}
