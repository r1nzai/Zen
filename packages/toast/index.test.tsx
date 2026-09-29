import { act, fireEvent, render, screen } from '@testing-library/react';

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
        expect(screen.getByRole('region', { name: 'Notifications' })).toHaveAttribute('popover', 'manual');
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

    it('shows at most three at once, newest kept', () => {
        render(
            <ToastProvider>
                <Trigger title="Hi" options={{ timeout: 0 }} />
            </ToastProvider>,
        );
        for (let i = 0; i < 5; i++) show('Hi');
        expect(screen.getAllByRole('status')).toHaveLength(3);
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
        const viewport = screen.getByRole('region', { name: 'Notifications' });
        expect(viewport.style.getPropertyValue('--zen-toast-offset')).toBe('5.5rem');
        expect(viewport).toHaveClass('left-4');
    });
});
