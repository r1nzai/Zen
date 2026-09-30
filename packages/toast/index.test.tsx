import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';

import Dialog from '../dialog';

import ToastProvider, { ToastOptions, useToast } from './index';

function Trigger({ title, options }: { title: string; options?: ToastOptions }) {
    const toast = useToast();
    return <button onClick={() => toast(title, options)}>show {title}</button>;
}

const show = (title: string) => fireEvent.click(screen.getByRole('button', { name: `show ${title}` }));

// jsdom keeps [popover] elements at display: none even once shown; browsers show them.
const popoverShown = document.createElement('style');
popoverShown.textContent = '[popover] { display: flex !important; }';

describe('Toast', () => {
    beforeAll(() => document.head.append(popoverShown));
    afterAll(() => popoverShown.remove());
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('shows in the top layer, above dialogs (a manual popover)', () => {
        render(
            <ToastProvider>
                <Trigger title="Saved" />
            </ToastProvider>,
        );
        show('Saved');
        expect(screen.getByRole('region', { name: 'Notifications (F8)' })).toHaveAttribute('popover', 'manual');
    });

    it('renders inside an open Dialog, and back on the page after it closes', () => {
        function Flow() {
            const toast = useToast();
            const [open, setOpen] = useState(false);
            return (
                <>
                    <button onClick={() => setOpen(true)}>open</button>
                    <Dialog open={open} onOpenChange={setOpen} title="Settings">
                        <button onClick={() => toast('Saved')}>save</button>
                        <button onClick={() => setOpen(false)}>close</button>
                    </Dialog>
                </>
            );
        }
        render(
            <ToastProvider>
                <Flow />
            </ToastProvider>,
        );
        fireEvent.click(screen.getByRole('button', { name: 'open' }));
        fireEvent.click(screen.getByRole('button', { name: 'save' }));
        expect(screen.getByRole('status').closest('dialog')).not.toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'close' }));
        expect(screen.getByRole('status').closest('dialog')).toBeNull();
    });

    it('still shows a toast added just before its dialog unmounts', () => {
        function Flow() {
            const toast = useToast();
            const [open, setOpen] = useState(true);
            return open ? (
                <Dialog open title="Change currency">
                    <button
                        onClick={() => {
                            toast('Converted to USD');
                            setOpen(false);
                        }}
                    >
                        convert
                    </button>
                </Dialog>
            ) : null;
        }
        render(
            <ToastProvider>
                <Flow />
            </ToastProvider>,
        );
        fireEvent.click(screen.getByRole('button', { name: 'convert' }));
        const status = screen.getByRole('status');
        expect(status).toHaveTextContent('Converted to USD');
        expect(status.closest('dialog')).toBeNull();
    });

    it('keeps its countdown when it moves into a dialog', () => {
        function Flow() {
            const toast = useToast();
            const [open, setOpen] = useState(false);
            return (
                <>
                    <button onClick={() => toast('Saved')}>save</button>
                    <button onClick={() => setOpen(true)}>open</button>
                    <Dialog open={open} onOpenChange={setOpen} title="Settings" />
                </>
            );
        }
        render(
            <ToastProvider>
                <Flow />
            </ToastProvider>,
        );
        fireEvent.click(screen.getByRole('button', { name: 'save' }));
        act(() => vi.advanceTimersByTime(3000));
        fireEvent.click(screen.getByRole('button', { name: 'open' }));
        expect(screen.getByRole('status', { hidden: true }).closest('dialog')).not.toBeNull();
        // 5 s in all: 3 s before the move and 2 s after, not 5 s more.
        act(() => vi.advanceTimersByTime(2000 + 300));
        expect(screen.queryByRole('status', { hidden: true })).toBeNull();
    });

    it('shows a status message with title and description', () => {
        render(
            <ToastProvider>
                <Trigger title="Saved" options={{ description: 'All changes stored', tone: 'success' }} />
            </ToastProvider>,
        );
        show('Saved');
        const toast = screen.getByRole('status');
        expect(toast).toHaveTextContent('Saved');
        expect(toast).toHaveTextContent('All changes stored');
        expect(toast).toHaveClass('border-primary/30');
    });

    it('uses an alert for errors', () => {
        render(
            <ToastProvider>
                <Trigger title="Failed" options={{ tone: 'error' }} />
            </ToastProvider>,
        );
        show('Failed');
        expect(screen.getByRole('alert')).toHaveTextContent('Failed');
    });

    it('is read out by a live region that exists before its text arrives', () => {
        render(
            <ToastProvider>
                <Trigger title="Failed" options={{ tone: 'error', description: 'Try again' }} />
            </ToastProvider>,
        );
        show('Failed');
        const region = screen.getByRole('alert').nextElementSibling!;
        expect(region).toHaveAttribute('aria-live', 'assertive');
        expect(region).toBeEmptyDOMElement();
        act(() => vi.advanceTimersByTime(50));
        expect(region).toHaveTextContent('Failed. Try again');
    });

    it('takes focus on F8 while there are toasts', () => {
        render(
            <ToastProvider>
                <Trigger title="Saved" />
            </ToastProvider>,
        );
        const viewport = screen.getByRole('region', { name: 'Notifications (F8)' });
        fireEvent.keyDown(document, { key: 'F8' });
        expect(viewport).not.toHaveFocus();
        show('Saved');
        fireEvent.keyDown(document, { key: 'F8' });
        expect(viewport).toHaveFocus();
    });

    it('goes away after its timeout', () => {
        render(
            <ToastProvider>
                <Trigger title="Hi" options={{ timeout: 1000 }} />
            </ToastProvider>,
        );
        show('Hi');
        act(() => vi.advanceTimersByTime(1000 + 300));
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('waits while hovered', () => {
        render(
            <ToastProvider>
                <Trigger title="Hi" options={{ timeout: 1000 }} />
            </ToastProvider>,
        );
        show('Hi');
        fireEvent.mouseEnter(screen.getByRole('status'));
        act(() => vi.advanceTimersByTime(5000));
        expect(screen.getByRole('status')).toBeInTheDocument();
        fireEvent.mouseLeave(screen.getByRole('status'));
        act(() => vi.advanceTimersByTime(1000 + 300));
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('runs its action and dismisses', () => {
        const onClick = vi.fn();
        render(
            <ToastProvider>
                <Trigger title="Deleted" options={{ action: { label: 'Undo', onClick } }} />
            </ToastProvider>,
        );
        show('Deleted');
        fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
        expect(onClick).toHaveBeenCalledTimes(1);
        act(() => vi.advanceTimersByTime(300));
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('can be dismissed', () => {
        render(
            <ToastProvider>
                <Trigger title="Hi" options={{ timeout: 0 }} />
            </ToastProvider>,
        );
        show('Hi');
        fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
        act(() => vi.advanceTimersByTime(300));
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('shows the newest three; older ones wait behind and come back as those go', () => {
        function Many() {
            const toast = useToast();
            return (
                <button onClick={() => [1, 2, 3, 4, 5].forEach((n) => toast(`Toast ${n}`, { timeout: 0 }))}>
                    many
                </button>
            );
        }
        render(
            <ToastProvider>
                <Many />
            </ToastProvider>,
        );
        fireEvent.click(screen.getByRole('button', { name: 'many' }));
        const waiting = () =>
            screen
                .getAllByRole('status')
                .filter((t) => t.hasAttribute('inert'))
                .map((t) => t.textContent);
        expect(waiting()).toEqual(['Toast 1', 'Toast 2']);
        fireEvent.click(
            within(screen.getByText('Toast 5').closest('[role=status]')!).getByRole('button', { name: 'Dismiss' }),
        );
        act(() => vi.advanceTimersByTime(300));
        expect(waiting()).toEqual(['Toast 1']);
    });

    it('fans out while pointed at, and waits meanwhile', () => {
        render(
            <ToastProvider>
                <Trigger title="Hi" options={{ timeout: 1000 }} />
            </ToastProvider>,
        );
        show('Hi');
        show('Hi');
        const deck = screen.getByRole('region', { name: 'Notifications (F8)' });
        const [back, front] = screen.getAllByRole('status');
        expect(back).toHaveAttribute('data-behind');
        expect(back.style.transform).toContain('scale(0.95)');
        fireEvent.mouseEnter(deck);
        expect(deck).toHaveAttribute('data-expanded');
        expect(back).not.toHaveAttribute('data-behind');
        expect(back.style.transform).toContain('scale(1)');
        act(() => vi.advanceTimersByTime(5000));
        expect(front).toBeInTheDocument();
    });

    it('keeps its timer bar steady while others come and go', () => {
        render(
            <ToastProvider>
                <Trigger title="Hi" options={{ timeout: 5000 }} />
            </ToastProvider>,
        );
        show('Hi');
        act(() => vi.advanceTimersByTime(1000));
        show('Hi');
        const [first, second] = screen.getAllByRole('status');
        const bar = first.querySelector<HTMLElement>('.zen__toast-timer')!;
        const delay = bar.style.animationDelay;
        act(() => vi.advanceTimersByTime(1000));
        fireEvent.click(within(second).getByRole('button', { name: 'Dismiss' }));
        act(() => vi.advanceTimersByTime(300));
        expect(bar.style.animationDelay).toBe(delay);
        // And its countdown carried on rather than starting over: 5 s in all.
        act(() => vi.advanceTimersByTime(5000 - 2300 - 1));
        expect(first).toBeInTheDocument();
        act(() => vi.advanceTimersByTime(1 + 300));
        expect(first).not.toBeInTheDocument();
    });

    it('can be swiped away', () => {
        render(
            <ToastProvider>
                <Trigger title="Hi" options={{ timeout: 0 }} />
            </ToastProvider>,
        );
        show('Hi');
        const toast = screen.getByRole('status');
        toast.setPointerCapture = () => {};
        fireEvent.pointerDown(toast, { clientX: 0, button: 0, pointerId: 1 });
        fireEvent.pointerMove(toast, { clientX: 20, pointerId: 1 });
        expect(toast.style.getPropertyValue('--zen-swipe')).toBe('20px');
        fireEvent.pointerMove(toast, { clientX: 120, pointerId: 1 });
        fireEvent.pointerUp(toast, { clientX: 120, pointerId: 1 });
        expect(toast).toHaveClass('translate-x-full');
        act(() => vi.advanceTimersByTime(300));
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('springs back from a short drag', () => {
        render(
            <ToastProvider>
                <Trigger title="Hi" options={{ timeout: 0 }} />
            </ToastProvider>,
        );
        show('Hi');
        const toast = screen.getByRole('status');
        toast.setPointerCapture = () => {};
        fireEvent.pointerDown(toast, { clientX: 0, button: 0, pointerId: 1 });
        act(() => vi.advanceTimersByTime(500));
        fireEvent.pointerMove(toast, { clientX: 20, pointerId: 1 });
        fireEvent.pointerUp(toast, { clientX: 20, pointerId: 1 });
        expect(toast.style.getPropertyValue('--zen-swipe')).toBe('0px');
        act(() => vi.advanceTimersByTime(300));
        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('useToast needs a provider', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => render(<Trigger title="x" />)).toThrow(/ToastProvider/);
    });

    it('can sit higher on phones (offset) and take classes', () => {
        render(
            <ToastProvider offset="5.5rem" viewportClassName="left-4">
                app
            </ToastProvider>,
        );
        const viewport = screen.getByRole('region', { name: 'Notifications (F8)' });
        expect(viewport.style.getPropertyValue('--zen-toast-offset')).toBe('5.5rem');
        expect(viewport).toHaveClass('left-4');
    });
});
