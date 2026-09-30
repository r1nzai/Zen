import { Button, Checkbox, Dialog, DialogClose, DialogFooter } from '@rinzai/zen';
import { useState } from 'react';

/** With side, a dialog slides in from an edge: a bottom sheet (phones) or a side panel (filters, details). */
export default function Sheets() {
    const [side, setSide] = useState<'bottom' | 'right' | 'left' | null>(null);
    return (
        <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setSide('bottom')}>
                Bottom sheet
            </Button>
            <Button variant="outline" onClick={() => setSide('right')}>
                Side panel
            </Button>
            <Dialog
                open={side !== null}
                onOpenChange={(open) => !open && setSide(null)}
                side={side ?? 'right'}
                title="Filters"
                description="Show only what you need."
            >
                <div className="flex flex-col gap-3">
                    <Checkbox defaultChecked>Income</Checkbox>
                    <Checkbox defaultChecked>Spending</Checkbox>
                    <Checkbox>Transfers</Checkbox>
                </div>
                <DialogFooter className="mt-auto">
                    <DialogClose variant="ghost">Cancel</DialogClose>
                    <DialogClose>Apply</DialogClose>
                </DialogFooter>
            </Dialog>
        </div>
    );
}
