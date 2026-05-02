import { fireEvent, render, screen } from '@testing-library/react';
import Popover from './index';

describe('Popover', () => {
    describe('rendering', () => {
        it('renders children inside the trigger wrapper', () => {
            render(<Popover content={<span>content</span>}>trigger text</Popover>);
            expect(screen.getByText('trigger text')).toBeInTheDocument();
        });

        it('renders content inside the popover panel', () => {
            render(<Popover content={<span>popover content</span>}>trigger</Popover>);
            expect(screen.getByText('popover content')).toBeInTheDocument();
        });

        it('popover panel has the zen__popover class', () => {
            render(<Popover content={<span>content</span>}>trigger</Popover>);
            const panel = screen.getByRole('tooltip', { hidden: true });
            expect(panel).toHaveClass('zen__popover');
        });

        it('popover panel has role="tooltip" by default', () => {
            render(<Popover content={<span>content</span>}>trigger</Popover>);
            expect(screen.getByRole('tooltip', { hidden: true })).toBeInTheDocument();
        });

        it('accepts a custom className on the popover panel', () => {
            render(
                <Popover className="my-panel" content={<span>content</span>}>
                    trigger
                </Popover>,
            );
            expect(screen.getByRole('tooltip', { hidden: true })).toHaveClass('my-panel');
        });
    });

    describe('click trigger (auto)', () => {
        it('calls togglePopover when the trigger is clicked', () => {
            render(
                <Popover trigger="click" triggerType="auto" content={<span>content</span>}>
                    <button>open</button>
                </Popover>,
            );
            fireEvent.click(screen.getByText('open'));
            expect(HTMLElement.prototype.togglePopover).toHaveBeenCalled();
        });
    });

    describe('hover trigger', () => {
        it('calls showPopover on mouseenter', () => {
            render(
                <Popover trigger="hover" triggerType="auto" content={<span>content</span>}>
                    <span>hover me</span>
                </Popover>,
            );
            // The trigger wrapper is the parent of the children text
            const trigger = screen.getByText('hover me').parentElement!;
            fireEvent.mouseEnter(trigger);
            expect(HTMLElement.prototype.showPopover).toHaveBeenCalled();
        });

        it('calls hidePopover on mouseleave', () => {
            render(
                <Popover trigger="hover" triggerType="auto" content={<span>content</span>}>
                    <span>hover me</span>
                </Popover>,
            );
            const trigger = screen.getByText('hover me').parentElement!;
            fireEvent.mouseLeave(trigger);
            expect(HTMLElement.prototype.hidePopover).toHaveBeenCalled();
        });
    });

    describe('manual triggerType', () => {
        it('calls setShow with toggled value when trigger is clicked', () => {
            const setShow = vi.fn();
            render(
                <Popover
                    trigger="click"
                    triggerType="manual"
                    show={false}
                    setShow={setShow}
                    content={<span>content</span>}
                >
                    <button>open</button>
                </Popover>,
            );
            fireEvent.click(screen.getByText('open'));
            expect(setShow).toHaveBeenCalledWith(true);
        });

        it('calls showPopover when show becomes true', () => {
            const { rerender } = render(
                <Popover triggerType="manual" show={false} content={<span>content</span>}>
                    trigger
                </Popover>,
            );
            rerender(
                <Popover triggerType="manual" show={true} content={<span>content</span>}>
                    trigger
                </Popover>,
            );
            expect(HTMLElement.prototype.showPopover).toHaveBeenCalled();
        });

        it('calls hidePopover when show becomes false', () => {
            const { rerender } = render(
                <Popover triggerType="manual" show={true} content={<span>content</span>}>
                    trigger
                </Popover>,
            );
            rerender(
                <Popover triggerType="manual" show={false} content={<span>content</span>}>
                    trigger
                </Popover>,
            );
            expect(HTMLElement.prototype.hidePopover).toHaveBeenCalled();
        });
    });

    describe('event callbacks', () => {
        it('calls onOpen when the popover:open event fires on the panel', () => {
            const onOpen = vi.fn();
            render(
                <Popover onOpen={onOpen} content={<span>content</span>}>
                    trigger
                </Popover>,
            );
            const panel = screen.getByRole('tooltip', { hidden: true });
            panel.dispatchEvent(new Event('popover:open'));
            expect(onOpen).toHaveBeenCalledTimes(1);
        });

        it('calls onClose when the popover:close event fires on the panel', () => {
            const onClose = vi.fn();
            render(
                <Popover onClose={onClose} content={<span>content</span>}>
                    trigger
                </Popover>,
            );
            const panel = screen.getByRole('tooltip', { hidden: true });
            panel.dispatchEvent(new Event('popover:close'));
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });
});
