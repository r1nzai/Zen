import { Badge, Popover } from '@rinzai/zen';

export default function Tooltip() {
    return (
        <Popover
            trigger="hover"
            content={
                <div className="p-3 text-sm">
                    <p className="font-medium">Beta feature</p>
                    <p className="text-muted-foreground mt-0.5!">This feature is still in preview and may change.</p>
                </div>
            }
        >
            <Badge variant="secondary">Beta</Badge>
        </Popover>
    );
}
