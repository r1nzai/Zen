import { Button, ConfirmDialog } from '@rinzai/zen';
import { useState } from 'react';

export default function Confirm() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button variant="destructive" onClick={() => setOpen(true)}>
                Delete goal
            </Button>
            <ConfirmDialog
                open={open}
                onOpenChange={setOpen}
                title="Delete this goal?"
                description="Its progress history is removed too. This can't be undone."
                confirmLabel="Delete"
                destructive
                onConfirm={() => {}}
            />
        </>
    );
}
