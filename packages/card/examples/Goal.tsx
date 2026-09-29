import { Button, buttonVariants, Card, Ellipsis, Menu, MenuItem, ProgressRing } from '@rinzai/zen';

export default function Goal() {
    return (
        <Card
            title="Emergency fund"
            action={
                <Menu
                    label="Goal actions"
                    triggerClassName={buttonVariants({ variant: 'icon', size: 'icon' })}
                    trigger={<Ellipsis />}
                >
                    <MenuItem>Edit</MenuItem>
                </Menu>
            }
            className="w-full max-w-sm"
        >
            <div className="flex items-center gap-4">
                <ProgressRing value={0.64} label="Emergency fund">
                    <span className="text-sm font-semibold tabular-nums">64%</span>
                </ProgressRing>
                <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-sm">$6,400 of $10,000</span>
                    <Button size="sm" variant="secondary" className="self-start">
                        Add money
                    </Button>
                </div>
            </div>
        </Card>
    );
}
