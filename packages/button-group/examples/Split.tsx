import { Button, ButtonGroup, buttonVariants, Menu, MenuContent, MenuItem, MenuTrigger, useToast } from '@rinzai/zen';
import ChevronDown from '@zen/icons/chevron-down';

/** A split button: the usual action, and a menu of the others. */
export default function Split() {
    const toast = useToast();
    return (
        <ButtonGroup>
            <Button variant="outline" onClick={() => toast('Exported as CSV', { tone: 'positive' })}>
                Export CSV
            </Button>
            <Menu>
                <MenuTrigger
                    aria-label="More export formats"
                    className={buttonVariants({ variant: 'outline', size: 'icon' })}
                >
                    <ChevronDown className="size-4" />
                </MenuTrigger>
                <MenuContent align="end">
                    <MenuItem onSelect={() => toast('Exported as Excel', { tone: 'positive' })}>Excel</MenuItem>
                    <MenuItem onSelect={() => toast('Exported as PDF', { tone: 'positive' })}>PDF</MenuItem>
                </MenuContent>
            </Menu>
        </ButtonGroup>
    );
}
