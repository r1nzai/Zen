import { fireEvent, render, screen } from '@testing-library/react';
import { useRef } from 'react';

import ConfirmDialog from '../confirm-dialog';
import Dialog, { DialogClose, DialogFooter } from './index';

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

    it('with side, is a sheet on that edge, still a labelled modal dialog', () => {
        render(<Dialog open side="bottom" title="Filters" />);
        const sheet = screen.getByRole('dialog', { name: 'Filters' });
        expect(sheet).toHaveAttribute('data-side', 'bottom');
        expect(sheet).toHaveClass('rounded-t-2xl');
        expect(dialogEl().open).toBe(true);
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

    describe('parts', () => {
        it('DialogClose closes the dialog after its own onClick', () => {
            const onOpenChange = vi.fn();
            const onClick = vi.fn();
            render(
                <Dialog open onOpenChange={onOpenChange} title="Rename">
                    <DialogFooter className="mt-2">
                        <DialogClose variant="outline">Cancel</DialogClose>
                        <DialogClose onClick={onClick}>Save</DialogClose>
                    </DialogFooter>
                </Dialog>,
            );
            fireEvent.click(screen.getByRole('button', { name: 'Save', hidden: true }));
            expect(onClick).toHaveBeenCalledTimes(1);
            expect(onOpenChange).toHaveBeenCalledWith(false);
            expect(screen.getByRole('button', { name: 'Cancel', hidden: true }).parentElement).toHaveClass(
                'flex',
                'justify-end',
                'gap-2',
                'mt-2',
            );
        });

        it('preventDefault in onClick keeps it open (e.g. invalid form)', () => {
            const onOpenChange = vi.fn();
            render(
                <Dialog open onOpenChange={onOpenChange} title="Rename">
                    <DialogClose onClick={(e) => e.preventDefault()}>Save</DialogClose>
                </Dialog>,
            );
            fireEvent.click(screen.getByRole('button', { name: 'Save', hidden: true }));
            expect(onOpenChange).not.toHaveBeenCalled();
        });
    });
});

describe('Dialog sheet swipe', () => {
    // Event times: each touch event is 16ms after the last, a finger moving at a frame's pace.
    let now = 0;
    const touch = (el: Element, type: 'down' | 'move' | 'up', x: number, y: number, more = {}) => {
        now += 16;
        const init = { clientX: x, clientY: y, pointerId: 1, pointerType: 'touch', isPrimary: true, ...more };
        if (type === 'down') fireEvent.pointerDown(el, init);
        else if (type === 'move') fireEvent.pointerMove(el, init);
        else fireEvent.pointerUp(el, init);
    };
    const swipe = (el: Element, dx: number, dy: number, more = {}) => {
        touch(el, 'down', 100, 100, more);
        touch(el, 'move', 100 + dx / 2, 100 + dy / 2, more);
        touch(el, 'move', 100 + dx, 100 + dy, more);
        touch(el, 'up', 100 + dx, 100 + dy, more);
    };
    beforeEach(() => {
        vi.spyOn(Event.prototype, 'timeStamp', 'get').mockImplementation(() => now);
        vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(400);
        vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(320);
    });
    afterEach(() => vi.restoreAllMocks());

    const sheet = (props: Partial<Parameters<typeof Dialog>[0]> = {}) => {
        const onOpenChange = vi.fn();
        render(
            <Dialog open side="bottom" title="Filters" onOpenChange={onOpenChange} {...props}>
                <input aria-label="Name" />
                <button type="button">Apply</button>
            </Dialog>,
        );
        return onOpenChange;
    };

    it('follows a finger down, and closes when let go far enough', () => {
        const onOpenChange = sheet();
        const title = screen.getByText('Filters');
        touch(title, 'down', 100, 100);
        touch(title, 'move', 100, 160);
        expect(dialogEl().style.getPropertyValue('--zen-swipe')).toBe('0 60px');
        expect(dialogEl()).toHaveAttribute('data-swiping');
        touch(title, 'move', 100, 260);
        touch(title, 'up', 100, 260);
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('springs back from a short, slow swipe', () => {
        const onOpenChange = sheet();
        const title = screen.getByText('Filters');
        touch(title, 'down', 100, 100);
        touch(title, 'move', 100, 112);
        touch(title, 'move', 100, 116);
        touch(title, 'up', 100, 116);
        expect(onOpenChange).not.toHaveBeenCalled();
        expect(dialogEl().style.getPropertyValue('--zen-swipe')).toBe('');
        expect(dialogEl()).not.toHaveAttribute('data-swiping');
    });

    it('closes on a quick flick, short as it is', () => {
        const onOpenChange = sheet();
        const title = screen.getByText('Filters');
        touch(title, 'down', 100, 100);
        touch(title, 'move', 100, 120);
        touch(title, 'move', 100, 140);
        touch(title, 'up', 100, 140);
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('not a flick when the finger stopped before lifting', () => {
        const onOpenChange = sheet();
        const title = screen.getByText('Filters');
        touch(title, 'down', 100, 100);
        touch(title, 'move', 100, 120);
        touch(title, 'move', 100, 140);
        now += 300;
        touch(title, 'up', 100, 140);
        expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('a side panel closes by swiping toward its edge, not away from it', () => {
        const onOpenChange = sheet({ side: 'left' });
        swipe(screen.getByText('Filters'), 200, 0);
        expect(onOpenChange).not.toHaveBeenCalled();
        swipe(screen.getByText('Filters'), -200, 0);
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    describe('only when meant', () => {
        it('not with a mouse or pen', () => {
            const onOpenChange = sheet();
            swipe(screen.getByText('Filters'), 0, 300, { pointerType: 'mouse' });
            swipe(screen.getByText('Filters'), 0, 300, { pointerType: 'pen' });
            expect(onOpenChange).not.toHaveBeenCalled();
        });

        it('not mostly sideways, or upward', () => {
            const onOpenChange = sheet();
            swipe(screen.getByText('Filters'), 200, 120);
            swipe(screen.getByText('Filters'), 0, -300);
            expect(onOpenChange).not.toHaveBeenCalled();
        });

        it('not from a text field', () => {
            const onOpenChange = sheet();
            swipe(screen.getByLabelText('Name'), 0, 300);
            expect(onOpenChange).not.toHaveBeenCalled();
        });

        it('not from something that takes this gesture itself (its touch-action)', () => {
            const onOpenChange = sheet({ side: 'right' });
            screen.getByRole('button', { name: 'Apply' }).style.touchAction = 'pan-y';
            swipe(screen.getByRole('button', { name: 'Apply' }), 300, 0);
            expect(onOpenChange).not.toHaveBeenCalled();
        });

        it('not while the content can still scroll up', () => {
            const onOpenChange = sheet();
            const body = screen.getByText('Filters').closest('.overflow-y-auto') as HTMLElement;
            vi.spyOn(body, 'scrollHeight', 'get').mockReturnValue(900);
            vi.spyOn(body, 'clientHeight', 'get').mockReturnValue(400);
            body.style.overflowY = 'auto';
            body.scrollTop = 50;
            swipe(screen.getByText('Filters'), 0, 300);
            expect(onOpenChange).not.toHaveBeenCalled();
            body.scrollTop = 0;
            swipe(screen.getByText('Filters'), 0, 300);
            expect(onOpenChange).toHaveBeenCalledWith(false);
        });

        it('not once a second finger comes down', () => {
            const onOpenChange = sheet();
            const title = screen.getByText('Filters');
            touch(title, 'down', 100, 100);
            touch(title, 'move', 100, 200);
            touch(title, 'down', 200, 100, { pointerId: 2, isPrimary: false });
            touch(title, 'move', 100, 300);
            touch(title, 'up', 100, 300);
            expect(onOpenChange).not.toHaveBeenCalled();
            expect(dialogEl().style.getPropertyValue('--zen-swipe')).toBe('');
        });

        it('not when the sheet must be finished (dismissible={false})', () => {
            const onOpenChange = sheet({ dismissible: false });
            swipe(screen.getByText('Filters'), 0, 300);
            expect(onOpenChange).not.toHaveBeenCalled();
        });

        it('a swipe that began on a button is not a tap on it', () => {
            const onClick = vi.fn();
            render(
                <Dialog open side="bottom" title="Filters">
                    <button type="button" onClick={onClick}>
                        Pick
                    </button>
                </Dialog>,
            );
            const button = screen.getByRole('button', { name: 'Pick' });
            touch(button, 'down', 100, 100);
            touch(button, 'move', 100, 130);
            touch(button, 'up', 100, 130);
            fireEvent.click(button);
            expect(onClick).not.toHaveBeenCalled();
            fireEvent.click(button);
            expect(onClick).toHaveBeenCalledOnce();
        });
    });
});
