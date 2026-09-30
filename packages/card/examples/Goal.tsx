import {
    Button,
    buttonVariants,
    Card,
    CardHeader,
    CardTitle,
    Menu,
    MenuContent,
    MenuItem,
    MenuTrigger,
    ProgressRing,
} from '@rinzai/zen';
import Ellipsis from '@zen/icons/ellipsis';

export default function Goal() {
    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle>Emergency fund</CardTitle>
                <Menu>
                    <MenuTrigger
                        aria-label="Goal actions"
                        className={buttonVariants({ variant: 'icon', size: 'icon' })}
                    >
                        <Ellipsis />
                    </MenuTrigger>
                    <MenuContent>
                        <MenuItem>Edit</MenuItem>
                    </MenuContent>
                </Menu>
            </CardHeader>
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
