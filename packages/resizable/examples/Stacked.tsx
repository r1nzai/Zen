import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@rinzai/zen';

/** Three panels stacked, each with a smallest size: drag either line, or focus one and use ↑↓. */
export default function Stacked() {
    return (
        <ResizablePanelGroup orientation="vertical" className="border-tint/10 h-80 w-full max-w-md rounded-xl border">
            <ResizablePanel defaultSize={25} minSize={15}>
                <div className="flex h-full flex-col justify-center gap-0.5 px-4">
                    <span className="text-muted-foreground text-xs">Balance</span>
                    <span className="text-lg font-semibold tabular-nums">$12,480</span>
                </div>
            </ResizablePanel>
            <ResizableHandle aria-label="Resize balance" />
            <ResizablePanel defaultSize={45} minSize={20}>
                <div className="text-muted-foreground flex h-full items-center justify-center text-sm">This month</div>
            </ResizablePanel>
            <ResizableHandle aria-label="Resize this month" />
            <ResizablePanel minSize={15}>
                <div className="text-muted-foreground flex h-full items-center justify-center text-sm">Upcoming</div>
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}
