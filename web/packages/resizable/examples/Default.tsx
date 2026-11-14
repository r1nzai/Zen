import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@rinzai/zen';

/** A sidebar beside the main view, and a detail pane under it: drag a line, or focus it and use the arrow keys. */
export default function Default() {
    return (
        <ResizablePanelGroup className="border-tint/10 h-72 w-full max-w-2xl rounded-xl border">
            <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                <div className="flex h-full flex-col gap-1 p-4">
                    <span className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                        Accounts
                    </span>
                    <span className="text-sm">Everyday</span>
                    <span className="text-sm">Savings</span>
                    <span className="text-sm">Credit card</span>
                </div>
            </ResizablePanel>
            <ResizableHandle aria-label="Resize accounts" />
            <ResizablePanel>
                <ResizablePanelGroup orientation="vertical">
                    <ResizablePanel defaultSize={65} minSize={30}>
                        <div className="flex h-full items-center justify-center text-sm">Transactions</div>
                    </ResizablePanel>
                    <ResizableHandle aria-label="Resize details" />
                    <ResizablePanel minSize={20}>
                        <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                            Details
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}
