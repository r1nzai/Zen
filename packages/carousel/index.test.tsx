import { act, fireEvent, render, screen } from '@testing-library/react';

import Carousel, { CarouselContent, CarouselDots, CarouselItem, CarouselNext, CarouselPrevious } from './index';

/** Lays the content out as jsdom can't: slides 300px wide, seen through `width`. */
function layOut(content: HTMLElement, width = 300) {
    const items = Array.from(content.children) as HTMLElement[];
    Object.defineProperty(content, 'clientWidth', { configurable: true, value: width });
    Object.defineProperty(content, 'scrollWidth', { configurable: true, value: 300 * items.length });
    content.getBoundingClientRect = () => ({ left: 0, right: width }) as DOMRect;
    items.forEach((item, i) => {
        item.getBoundingClientRect = () =>
            ({ left: 300 * i - content.scrollLeft, right: 300 * (i + 1) - content.scrollLeft }) as DOMRect;
    });
}

function Goals() {
    return (
        <Carousel aria-label="Goals">
            <CarouselContent data-testid="content">
                <CarouselItem>Fund</CarouselItem>
                <CarouselItem>Laptop</CarouselItem>
                <CarouselItem>Trip</CarouselItem>
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
            <CarouselDots />
        </Carousel>
    );
}

async function scrollTo(content: HTMLElement, left: number) {
    content.scrollLeft = left;
    fireEvent.scroll(content);
    await act(() => new Promise((done) => requestAnimationFrame(done)));
}

const scroll = vi.fn();

describe('Carousel', () => {
    beforeEach(() => {
        scroll.mockClear();
        HTMLElement.prototype.scrollTo = scroll;
    });

    it('is a labelled carousel of slides, each announced as which of how many', () => {
        render(<Goals />);
        const carousel = screen.getByRole('region', { name: 'Goals' });
        expect(carousel).toHaveAttribute('aria-roledescription', 'carousel');
        const slides = screen.getAllByRole('group');
        expect(slides.map((s) => s.getAttribute('aria-label'))).toEqual(['1 of 3', '2 of 3', '3 of 3']);
        expect(slides[0]).toHaveAttribute('aria-roledescription', 'slide');
        // Focusable, so arrow keys scroll it natively; changes are announced.
        expect(screen.getByTestId('content')).toHaveAttribute('tabindex', '0');
        expect(screen.getByTestId('content')).toHaveAttribute('aria-live', 'polite');
    });

    it('Next scrolls to the following slide; Previous is off at the first, without losing focus', async () => {
        render(<Goals />);
        const content = screen.getByTestId('content');
        layOut(content);
        await scrollTo(content, 0);
        const previous = screen.getByRole('button', { name: 'Previous slide' });
        expect(previous).toHaveAttribute('aria-disabled', 'true');
        expect(previous).not.toBeDisabled();
        fireEvent.click(previous);
        expect(scroll).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
        expect(scroll).toHaveBeenCalledWith(expect.objectContaining({ left: 300 }));
    });

    it('follows the scroll: the slide at the start is current, and Next is off at the end', async () => {
        render(<Goals />);
        const content = screen.getByTestId('content');
        layOut(content);
        await scrollTo(content, 300);
        expect(screen.getByRole('button', { name: 'Slide 2' })).toHaveAttribute('aria-current', 'true');
        expect(screen.getByRole('button', { name: 'Previous slide' })).not.toHaveAttribute('aria-disabled');
        await scrollTo(content, 600);
        expect(screen.getByRole('button', { name: 'Next slide' })).toHaveAttribute('aria-disabled', 'true');
        fireEvent.click(screen.getByRole('button', { name: 'Slide 1' }));
        expect(scroll).toHaveBeenCalledWith(expect.objectContaining({ left: 0 }));
    });

    it('a dot for each place it can scroll to: slides already in view at the end are not stops', async () => {
        render(<Goals />);
        const content = screen.getByTestId('content');
        // Two slides in view: it can only scroll one slide's width.
        layOut(content, 600);
        await scrollTo(content, 0);
        expect(screen.getAllByRole('button', { name: /^Slide/ })).toHaveLength(2);
    });

    it("reaches the end when the slides don't fill the view evenly", async () => {
        render(<Goals />);
        const content = screen.getByTestId('content');
        // A slide and a third in view: past the second slide's start, there's a third of one left to scroll.
        layOut(content, 400);
        await scrollTo(content, 300);
        const next = screen.getByRole('button', { name: 'Next slide' });
        expect(next).not.toHaveAttribute('aria-disabled');
        fireEvent.click(next);
        expect(scroll).toHaveBeenCalledWith(expect.objectContaining({ left: 500 }));
        await scrollTo(content, 500);
        expect(next).toHaveAttribute('aria-disabled', 'true');
        expect(screen.getAllByRole('button', { name: /^Slide/ })).toHaveLength(3);
        expect(screen.getByRole('button', { name: 'Slide 3' })).toHaveAttribute('aria-current', 'true');
    });

    it('parts outside a Carousel say so', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => render(<CarouselNext />)).toThrow('<CarouselNext> must be inside <Carousel>');
    });
});
