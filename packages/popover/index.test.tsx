import { fireEvent, render, screen } from '@testing-library/react';

import Button from '../button';
import Popover, { PopoverClose, PopoverContent, PopoverTrigger } from './index';

const panel = () => screen.getByRole('dialog', { hidden: true });

describe('Popover', () => {
    beforeEach(() => vi.clearAllMocks());

    it('is a button controlling a dialog popover', () => {
        render(
            <Popover>
                <PopoverTrigger>Open</PopoverTrigger>
                <PopoverContent aria-label="Details" className="my-panel">
                    content
                </PopoverContent>
            </Popover>,
        );
        const button = screen.getByRole('button', { name: 'Open' });
        expect(button).toHaveAttribute('popovertarget', panel().id);
        expect(button).toHaveAttribute('aria-haspopup', 'dialog');
        expect(button).toHaveAttribute('aria-expanded', 'false');
        expect(panel()).toHaveAttribute('popover', 'auto');
        expect(panel()).toHaveAttribute('aria-label', 'Details');
        expect(panel()).toHaveClass('zen__popover', 'my-panel');
        expect(panel()).toHaveTextContent('content');
    });

    it('asChild: your own button gets the wiring, keeping its own props', () => {
        render(
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="mine">
                        Open
                    </Button>
                </PopoverTrigger>
                <PopoverContent>content</PopoverContent>
            </Popover>,
        );
        const button = screen.getByRole('button', { name: 'Open' });
        expect(button).toHaveClass('mine', 'glow-edge');
        expect(button).toHaveAttribute('popovertarget', panel().id);
        expect(button.style.getPropertyValue('anchor-name')).toBe(`--${panel().id}`);
    });

    it('reports opening and closing, however it happens', () => {
        const onOpenChange = vi.fn();
        render(
            <Popover onOpenChange={onOpenChange}>
                <PopoverTrigger>Open</PopoverTrigger>
                <PopoverContent>content</PopoverContent>
            </Popover>,
        );
        panel().dispatchEvent(Object.assign(new Event('toggle'), { newState: 'open' }));
        expect(onOpenChange).toHaveBeenLastCalledWith(true);
        panel().dispatchEvent(Object.assign(new Event('toggle'), { newState: 'closed' }));
        expect(onOpenChange).toHaveBeenLastCalledWith(false);
    });

    it('follows `open`', () => {
        const { rerender } = render(
            <Popover open={false}>
                <PopoverTrigger>Open</PopoverTrigger>
                <PopoverContent>content</PopoverContent>
            </Popover>,
        );
        rerender(
            <Popover open>
                <PopoverTrigger>Open</PopoverTrigger>
                <PopoverContent>content</PopoverContent>
            </Popover>,
        );
        expect(panel().showPopover).toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Open' })).toHaveAttribute('aria-expanded', 'true');
        rerender(
            <Popover open={false}>
                <PopoverTrigger>Open</PopoverTrigger>
                <PopoverContent>content</PopoverContent>
            </Popover>,
        );
        expect(panel().hidePopover).toHaveBeenCalled();
    });

    it('PopoverClose closes it after its own onClick, unless that prevents it', () => {
        const onOpenChange = vi.fn();
        render(
            <Popover defaultOpen onOpenChange={onOpenChange}>
                <PopoverTrigger>Open</PopoverTrigger>
                <PopoverContent>
                    <PopoverClose onClick={(e) => e.preventDefault()}>Keep</PopoverClose>
                    <PopoverClose>Close</PopoverClose>
                </PopoverContent>
            </Popover>,
        );
        expect(onOpenChange).toHaveBeenLastCalledWith(true);
        fireEvent.click(screen.getByRole('button', { name: 'Keep', hidden: true }));
        expect(onOpenChange).toHaveBeenLastCalledWith(true);
        fireEvent.click(screen.getByRole('button', { name: 'Close', hidden: true }));
        expect(onOpenChange).toHaveBeenLastCalledWith(false);
    });

    it('centres under the trigger by default; align lines it up with an edge', () => {
        const { rerender } = render(
            <Popover>
                <PopoverTrigger>Open</PopoverTrigger>
                <PopoverContent>content</PopoverContent>
            </Popover>,
        );
        expect(panel().style.getPropertyValue('position-area')).toBe('block-end center');
        rerender(
            <Popover>
                <PopoverTrigger>Open</PopoverTrigger>
                <PopoverContent align="start">content</PopoverContent>
            </Popover>,
        );
        expect(panel().style.getPropertyValue('position-area')).toBe('block-end span-inline-end');
    });

    it('parts outside a Popover say so', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => render(<PopoverContent>content</PopoverContent>)).toThrow(
            '<PopoverContent> must be inside <Popover>',
        );
    });
});
