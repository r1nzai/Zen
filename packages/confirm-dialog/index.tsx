import { cx } from '@zen/utils/cx';
import Dialog, { DialogClose, DialogFooter, type DialogProps } from '@zen/dialog';

/** Confirmation for destructive or irreversible actions. Cancel has focus, so Enter is the safe choice. */
export default function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel,
    cancelLabel = 'Cancel',
    tone = 'default',
    onConfirm,
    className,
    ...rest
}: ConfirmDialogProps) {
    return (
        <Dialog
            {...rest}
            role="alertdialog"
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            description={description}
            className={cx('w-[26rem]', className)}
        >
            <DialogFooter>
                <DialogClose variant="outline" autoFocus>
                    {cancelLabel}
                </DialogClose>
                <DialogClose tone={tone} onClick={onConfirm}>
                    {confirmLabel}
                </DialogClose>
            </DialogFooter>
        </Dialog>
    );
}

/** Other props (data-*, an id) go on the <dialog>. */
export interface ConfirmDialogProps extends Omit<DialogProps, 'children' | 'role' | 'onOpenChange'> {
    onOpenChange: (open: boolean) => void;
    confirmLabel: string;
    cancelLabel?: string;
    /** `negative` for a destructive action: the confirm button is red. */
    tone?: 'default' | 'negative';
    onConfirm: () => void;
}
