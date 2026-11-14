import { act, fireEvent, render, screen } from '@testing-library/react';

import HoverCard, { HoverCardContent, HoverCardTrigger } from './index';

function Example() {
    return (
        <HoverCard>
            <HoverCardTrigger href="/people/priya">Priya</HoverCardTrigger>
            <HoverCardContent>
                12 payments this year. <a href="/people/priya/payments">See them</a>
            </HoverCardContent>
        </HoverCard>
    );
}

const card = () => screen.getByText(/12 payments/).closest('[popover]') as HTMLElement;
const trigger = () => screen.getByRole('link', { name: 'Priya' });

describe('HoverCard', () => {
    beforeEach(() => vi.clearAllMocks());
    afterEach(() => vi.useRealTimers());

    it('the trigger is a link, and the card a manual popover anchored to it', () => {
        render(<Example />);
        expect(trigger()).toHaveAttribute('href', '/people/priya');
        expect(card()).toHaveAttribute('popover', 'manual');
        expect(trigger().style.getPropertyValue('anchor-name')).toBe(`--${card().id}`);
    });

    it('shows once the pointer rests on the link, not as it passes over', () => {
        vi.useFakeTimers();
        render(<Example />);
        fireEvent.pointerEnter(trigger(), { pointerType: 'mouse' });
        act(() => vi.advanceTimersByTime(300));
        expect(card().showPopover).not.toHaveBeenCalled();
        fireEvent.pointerLeave(trigger(), { pointerType: 'mouse' });
        act(() => vi.advanceTimersByTime(500));
        expect(card().showPopover).not.toHaveBeenCalled();
        fireEvent.pointerEnter(trigger(), { pointerType: 'mouse' });
        act(() => vi.advanceTimersByTime(500));
        expect(card().showPopover).toHaveBeenCalled();
    });

    it('stays while the pointer moves onto the card', () => {
        vi.useFakeTimers();
        render(<Example />);
        fireEvent.pointerEnter(trigger(), { pointerType: 'mouse' });
        act(() => vi.advanceTimersByTime(500));
        fireEvent.pointerLeave(trigger(), { pointerType: 'mouse' });
        fireEvent.pointerEnter(card(), { pointerType: 'mouse' });
        act(() => vi.advanceTimersByTime(300));
        expect(card().hidePopover).not.toHaveBeenCalled();
    });

    it('Escape hides it', () => {
        render(<Example />);
        fireEvent.keyDown(trigger(), { key: 'Escape' });
        expect(card().hidePopover).toHaveBeenCalled();
    });

    it('can sit in a paragraph: the card is put in <body>', () => {
        const { container } = render(
            <p>
                Paid to <Example />
            </p>,
        );
        expect(container.querySelector('p [popover]')).toBeNull();
        expect(card().parentElement).toBe(document.body);
    });
});
