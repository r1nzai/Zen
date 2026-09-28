import { Badge, Button, Popover } from '@rinzai/zen';

export default function ProfileCard() {
    return (
        <Popover
            role="dialog"
            content={
                <div className="flex w-64 flex-col gap-3 p-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-full text-sm font-bold">
                            AJ
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold">Alex Johnson</span>
                            <span className="text-muted-foreground text-xs">alex@example.com</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Badge>Admin</Badge>
                        <Badge variant="outline">Pro</Badge>
                    </div>
                    <div className="border-tint/10 flex flex-col gap-1 border-t pt-3">
                        <Button variant="ghost" size="sm" className="justify-start">
                            View profile
                        </Button>
                        <Button variant="ghost" size="sm" className="justify-start">
                            Settings
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive justify-start">
                            Sign out
                        </Button>
                    </div>
                </div>
            }
        >
            <button className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-full text-sm font-bold">
                AJ
            </button>
        </Popover>
    );
}
