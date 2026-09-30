import { Button, Popover, PopoverClose, PopoverContent, PopoverTrigger } from '@rinzai/zen';
import { useState } from 'react';

/** Follow your own state with `open`; `onOpenChange` hears every open and close (outside clicks, Escape…). */
export default function Controlled() {
    const [open, setOpen] = useState(false);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button>{open ? 'Hide' : 'Show'} popover</Button>
            </PopoverTrigger>
            <PopoverContent aria-label="Controlled">
                <div className="flex flex-col gap-2 p-3 text-sm">
                    <p className="font-medium">Manually controlled</p>
                    <PopoverClose size="sm" variant="secondary">
                        Close
                    </PopoverClose>
                </div>
            </PopoverContent>
        </Popover>
    );
}
