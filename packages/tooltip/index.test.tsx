import { act, fireEvent, render, screen } from '@testing-library/react';

import Tooltip, { TooltipContent, TooltipTrigger } from './index';

function Example() {
    return (
        <Tooltip>
            <TooltipTrigger>Beta</TooltipTrigger>
            <TooltipContent>Still in preview</TooltipContent>
        </Tooltip>
    );
}

const tip = () => screen.getByRole('tooltip', { hidden: true });
const trigger = () => screen.getByRole('button', { name: 'Beta' });

describe('Tooltip', () => {
    beforeEach(() => vi.clearAllMocks());

    it('describes its trigger, as a manual popover anchored to it', () => {
        render(<Example />);
        expect(trigger()).toHaveAttribute('aria-describedby', tip().id);
        expect(trigger()).toHaveAccessibleDescription('Still in preview');
        expect(tip()).toHaveAttribute('popover', 'manual');
        expect(trigger().style.getPropertyValue('anchor-name')).toBe(`--${tip().id}`);
    });

    it('shows on mouse hover and hides a moment after the pointer leaves', () => {
        vi.useFakeTimers();
        render(<Example />);
        fireEvent.pointerEnter(trigger(), { pointerType: 'mouse' });
        expect(tip().showPopover).toHaveBeenCalled();
        fireEvent.pointerLeave(trigger(), { pointerType: 'mouse' });
        expect(tip().hidePopover).not.toHaveBeenCalled();
        act(() => vi.advanceTimersByTime(150));
        expect(tip().hidePopover).toHaveBeenCalled();
        vi.useRealTimers();
    });

    it('stays while the pointer moves onto the tooltip itself', () => {
        vi.useFakeTimers();
        render(<Example />);
        fireEvent.pointerEnter(trigger(), { pointerType: 'mouse' });
        fireEvent.pointerLeave(trigger(), { pointerType: 'mouse' });
        fireEvent.pointerEnter(tip(), { pointerType: 'mouse' });
        act(() => vi.advanceTimersByTime(150));
        expect(tip().hidePopover).not.toHaveBeenCalled();
        vi.useRealTimers();
    });

    it('does not show on touch', () => {
        render(<Example />);
        fireEvent.pointerEnter(trigger(), { pointerType: 'touch' });
        expect(tip().showPopover).not.toHaveBeenCalled();
    });

    it('Escape and blur hide it', () => {
        render(<Example />);
        fireEvent.keyDown(trigger(), { key: 'Escape' });
        expect(tip().hidePopover).toHaveBeenCalledTimes(1);
        fireEvent.blur(trigger());
        expect(tip().hidePopover).toHaveBeenCalledTimes(2);
    });

    it("asChild keeps the child's own handlers", () => {
        const onPointerEnter = vi.fn();
        render(
            <Tooltip>
                <TooltipTrigger asChild>
                    <a href="#x" onPointerEnter={onPointerEnter}>
                        Link
                    </a>
                </TooltipTrigger>
                <TooltipContent>Hint</TooltipContent>
            </Tooltip>,
        );
        fireEvent.pointerEnter(screen.getByRole('link'), { pointerType: 'mouse' });
        expect(onPointerEnter).toHaveBeenCalled();
        expect(tip().showPopover).toHaveBeenCalled();
    });
});
