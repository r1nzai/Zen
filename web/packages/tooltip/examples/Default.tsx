import { Badge, Tooltip, TooltipContent, TooltipTrigger } from '@rinzai/zen';

/** Shows on hover and on keyboard focus; the trigger is described by it for screen readers. */
export default function Default() {
    return (
        <Tooltip>
            <TooltipTrigger className="rounded-md">
                <Badge variant="secondary">Beta</Badge>
            </TooltipTrigger>
            <TooltipContent>
                <div className="p-3 text-sm">
                    <p className="font-medium">Beta feature</p>
                    <p className="text-muted-foreground mt-0.5!">This feature is still in preview and may change.</p>
                </div>
            </TooltipContent>
        </Tooltip>
    );
}
