import { fireEvent, render, screen } from '@testing-library/react';
import { useRef } from 'react';

import ConfirmDialog from '../confirm-dialog';
import Dialog from './index';

const dialogEl = () => document.querySelector('dialog')!;

describe('Dialog', () => {
    it('opens as a modal when open', () => {
        render(
            <Dialog open title="Rename" description="Pick a new name">
                <p>body</p>
            </Dialog>,
        );
        expect(dialogEl().open).toBe(true);
        expect(screen.getByRole('dialog', { name: 'Rename' })).toHaveAccessibleDescription('Pick a new name');
        expect(screen.getByText('body')).toBeInTheDocument();
    });

    it('stays closed when not open, and closes when open turns false', () => {
        const { rerender } = render(<Dialog open={false} title="Rename" />);
        expect(dialogEl().open).toBe(false);
        rerender(<Dialog open title="Rename" />);
        expect(dialogEl().open).toBe(true);
        rerender(<Dialog open={false} title="Rename" />);
        expect(dialogEl().open).toBe(false);
    });

    it('asks to close on Escape and on a backdrop click', () => {
        const onOpenChange = vi.fn();
        render(<Dialog open title="Rename" onOpenChange={onOpenChange} />);
        fireEvent(dialogEl(), new Event('cancel', { cancelable: true }));
        fireEvent.click(dialogEl());
        expect(onOpenChange).toHaveBeenCalledTimes(2);
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('ignores Escape and backdrop clicks when not dismissible', () => {
        const onOpenChange = vi.fn();
        render(<Dialog open dismissible={false} title="Rename" onOpenChange={onOpenChange} />);
        const cancel = new Event('cancel', { cancelable: true });
        fireEvent(dialogEl(), cancel);
        fireEvent.click(dialogEl());
        expect(onOpenChange).not.toHaveBeenCalled();
        expect(cancel.defaultPrevented).toBe(true);
    });

    it('does not close on clicks inside the content', () => {
        const onOpenChange = vi.fn();
        render(
            <Dialog open title="Rename" onOpenChange={onOpenChange}>
                <button>inside</button>
            </Dialog>,
        );
        fireEvent.click(screen.getByText('inside'));
        expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('focuses initialFocus when it opens', () => {
        function WithFocus() {
            const ref = useRef<HTMLInputElement>(null);
            return (
                <Dialog open title="Rename" initialFocus={ref}>
                    <input aria-label="first" />
                    <input aria-label="name" ref={ref} />
                </Dialog>
            );
        }
        render(<WithFocus />);
        expect(screen.getByLabelText('name')).toHaveFocus();
    });
});

describe('ConfirmDialog', () => {
    it('is an alert dialog with focus on cancel', () => {
        render(
            <ConfirmDialog
                open
                onOpenChange={() => {}}
                title="Delete goal?"
                confirmLabel="Delete"
                onConfirm={() => {}}
            />,
        );
        expect(screen.getByRole('alertdialog', { name: 'Delete goal?' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    });

    it('confirms then closes', () => {
        const onConfirm = vi.fn();
        const onOpenChange = vi.fn();
        render(
            <ConfirmDialog
                open
                onOpenChange={onOpenChange}
                title="Delete goal?"
                confirmLabel="Delete"
                destructive
                onConfirm={onConfirm}
            />,
        );
        const confirm = screen.getByRole('button', { name: 'Delete' });
        expect(confirm).toHaveClass('bg-destructive/90');
        fireEvent.click(confirm);
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('cancel closes without confirming', () => {
        const onConfirm = vi.fn();
        const onOpenChange = vi.fn();
        render(
            <ConfirmDialog
                open
                onOpenChange={onOpenChange}
                title="Delete?"
                confirmLabel="Delete"
                onConfirm={onConfirm}
            />,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(onConfirm).not.toHaveBeenCalled();
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });
});
