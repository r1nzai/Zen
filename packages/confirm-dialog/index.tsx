import Dialog, { DialogClose, DialogFooter } from '@zen/dialog';
import { ReactNode } from 'react';

/** Confirmation for destructive or irreversible actions. Cancel has focus, so Enter is the safe choice. */
export default function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel,
    cancelLabel = 'Cancel',
    destructive = false,
    onConfirm,
}: ConfirmDialogProps) {
    return (
        <Dialog
            role="alertdialog"
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            description={description}
            className="w-[26rem]"
        >
            <DialogFooter>
                <DialogClose variant="outline" autoFocus>
                    {cancelLabel}
                </DialogClose>
                <DialogClose variant={destructive ? 'destructive' : 'default'} onClick={onConfirm}>
                    {confirmLabel}
                </DialogClose>
            </DialogFooter>
        </Dialog>
    );
}

export interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: ReactNode;
    description?: ReactNode;
    confirmLabel: string;
    cancelLabel?: string;
    destructive?: boolean;
    onConfirm: () => void;
}
