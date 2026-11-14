import { Button, Dialog, DialogClose, DialogFooter, Input } from '@rinzai/zen';
import { useState } from 'react';

export default function Form() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button onClick={() => setOpen(true)}>Rename</Button>
            <Dialog
                open={open}
                onOpenChange={setOpen}
                title="Rename category"
                description="Entries in this category keep their history."
            >
                <label className="flex flex-col gap-2">
                    Name
                    <Input defaultValue="Groceries" />
                </label>
                <DialogFooter>
                    <DialogClose variant="outline">Cancel</DialogClose>
                    <DialogClose>Save</DialogClose>
                </DialogFooter>
            </Dialog>
        </>
    );
}
