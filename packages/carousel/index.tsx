import ChevronLeft from '@zen/icons/chevron-left';
import ChevronRight from '@zen/icons/chevron-right';
import { cx } from '@zen/utils/cx';
import { useMessages } from '@zen/locale-provider';
import { reducedMotion } from '@zen/utils/motion';
import { useMergedRefs } from '@zen/utils/refs';
import {
    ComponentProps,
    createContext,
    RefObject,
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

interface CarouselContextValue {
    contentRef: RefObject<HTMLDivElement | null>;
    /** The slide at the start edge. */
    index: number;
    /** How many slides can be at the start edge: the last few may already be in view. */
    stops: number;
    count: number;
    scrollTo: (index: number) => void;
}

const CarouselContext = createContext<CarouselContextValue | null>(null);

function useCarousel(part: string) {
    const ctx = useContext(CarouselContext);
    if (!ctx) throw new Error(`<${part}> must be inside <Carousel>`);
    return ctx;
}

/** Where `item` starts, along the scroll from the content's start edge (in either reading direction). */
function startOf(item: Element, content: HTMLElement) {
    const i = item.getBoundingClientRect();
    const c = content.getBoundingClientRect();
    const rtl = getComputedStyle(content).direction === 'rtl';
    return (rtl ? c.right - i.right : i.left - c.left) + Math.abs(content.scrollLeft);
}

/**
 * Slides in a row that scrolls sideways and snaps to each one: swipe, scroll,
 * use the arrow keys once it has focus, or the CarouselPrevious and
 * CarouselNext buttons. Put a CarouselContent of CarouselItems inside, and the
 * buttons and CarouselDots if you want them. A slide is as wide as the
 * carousel unless you size it (e.g. `basis-1/3` for three in view).
 */
export default function Carousel({ className, children, ...rest }: CarouselProps) {
    const m = useMessages();
    const contentRef = useRef<HTMLDivElement>(null);
    const [state, setState] = useState({ index: 0, stops: 1, count: 0 });

    const measure = useCallback(() => {
        const content = contentRef.current;
        if (!content) return;
        const items = Array.from(content.children);
        const scrolled = Math.abs(content.scrollLeft);
        const max = content.scrollWidth - content.clientWidth;
        const first = items[0] ? startOf(items[0], content) : 0;
        const starts = items.map((item) => startOf(item, content) - first);
        const stops = Math.max(1, starts.filter((at) => at <= max + 1).length);
        let index = 0;
        starts.forEach((at, i) => {
            if (i < stops && Math.abs(at - scrolled) < Math.abs(starts[index] - scrolled)) index = i;
        });
        // Scrolled to the end, the last stop is current even if it isn't at the start edge.
        if (max > 0 && scrolled >= max - 1) index = stops - 1;
        setState((s) =>
            s.index === index && s.stops === stops && s.count === items.length
                ? s
                : { index, stops, count: items.length },
        );
    }, []);

    useIsoLayoutEffect(() => {
        const content = contentRef.current;
        if (!content) return;
        measure();
        let frame = 0;
        const schedule = () => {
            frame ||= requestAnimationFrame(() => {
                frame = 0;
                measure();
            });
        };
        content.addEventListener('scroll', schedule, { passive: true });
        const resizes = new ResizeObserver(schedule);
        resizes.observe(content);
        const changes = typeof MutationObserver === 'undefined' ? null : new MutationObserver(schedule);
        changes?.observe(content, { childList: true });
        return () => {
            content.removeEventListener('scroll', schedule);
            resizes.disconnect();
            changes?.disconnect();
            cancelAnimationFrame(frame);
        };
    }, [measure]);

    const scrollTo = useCallback((index: number) => {
        const content = contentRef.current;
        const item = content?.children[index];
        if (!content || !item) return;
        const first = content.children[0];
        const at = startOf(item, content) - startOf(first, content);
        const rtl = getComputedStyle(content).direction === 'rtl';
        content.scrollTo({ left: rtl ? -at : at, behavior: reducedMotion() ? 'instant' : 'smooth' });
    }, []);

    return (
        <CarouselContext.Provider value={{ contentRef, ...state, scrollTo }}>
            <section aria-roledescription={m.carousel} {...rest} className={cx('zen__carousel relative', className)}>
                {children}
            </section>
        </CarouselContext.Provider>
    );
}

/** The scrolling row of slides. */
export function CarouselContent({ ref, className, ...rest }: ComponentProps<'div'>) {
    const { contentRef } = useCarousel('CarouselContent');
    const refs = useMergedRefs(contentRef, ref);
    return (
        <div
            // Focusable, so the arrow keys scroll it (and snap to the next slide).
            tabIndex={0}
            aria-live="polite"
            {...rest}
            ref={refs}
            className={cx(
                'flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain rounded-xl',
                'focus-ring [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                className,
            )}
        />
    );
}

/** One slide: it's announced as which of how many. */
export function CarouselItem({ ref, className, ...rest }: ComponentProps<'div'>) {
    const m = useMessages();
    const { count } = useCarousel('CarouselItem');
    const own = useRef<HTMLDivElement>(null);
    const refs = useMergedRefs(own, ref);
    const [position, setPosition] = useState(0);
    useIsoLayoutEffect(() => {
        const el = own.current;
        if (el?.parentElement) setPosition(Array.prototype.indexOf.call(el.parentElement.children, el) + 1);
    }, [count]);
    return (
        <div
            role="group"
            aria-roledescription={m.slide}
            aria-label={position && count ? m.slideOf(position, count) : undefined}
            {...rest}
            ref={refs}
            className={cx('min-w-0 shrink-0 grow-0 basis-full snap-start', className)}
        />
    );
}

const ARROW =
    'glass glass-blur text-foreground absolute top-1/2 z-10 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full transition-opacity focus-ring hover:bg-tint/[0.08] aria-disabled:cursor-not-allowed aria-disabled:opacity-0 aria-disabled:focus-visible:opacity-40';

/**
 * Scroll back one slide: a round glass button over the start edge, gone at the
 * first. Place it elsewhere with className.
 */
export function CarouselPrevious({ className, onClick, ...rest }: ComponentProps<'button'>) {
    const m = useMessages();
    const { index, scrollTo } = useCarousel('CarouselPrevious');
    // aria-disabled, not disabled: a disabled button would drop keyboard focus at the end.
    const off = index === 0;
    return (
        <button
            type="button"
            aria-label={m.previousSlide}
            {...rest}
            aria-disabled={off || undefined}
            className={cx(ARROW, 'start-3', className)}
            onClick={(e) => {
                onClick?.(e);
                if (!off && !e.defaultPrevented) scrollTo(index - 1);
            }}
        >
            <ChevronLeft aria-hidden className="size-4 rtl:-scale-x-100" />
        </button>
    );
}

/** Scroll on one slide: a round glass button over the end edge, gone at the last. */
export function CarouselNext({ className, onClick, ...rest }: ComponentProps<'button'>) {
    const m = useMessages();
    const { index, stops, scrollTo } = useCarousel('CarouselNext');
    const off = index >= stops - 1;
    return (
        <button
            type="button"
            aria-label={m.nextSlide}
            {...rest}
            aria-disabled={off || undefined}
            className={cx(ARROW, 'end-3', className)}
            onClick={(e) => {
                onClick?.(e);
                if (!off && !e.defaultPrevented) scrollTo(index + 1);
            }}
        >
            <ChevronRight aria-hidden className="size-4 rtl:-scale-x-100" />
        </button>
    );
}

/** A dot for each place it can scroll to, the current one drawn out long and lit; each goes there. */
export function CarouselDots({ className, ...rest }: ComponentProps<'div'>) {
    const m = useMessages();
    const { index, stops, scrollTo } = useCarousel('CarouselDots');
    if (stops < 2) return null;
    return (
        <div {...rest} className={cx('mt-3 flex justify-center gap-0.5', className)}>
            {Array.from({ length: stops }, (_, i) => (
                <button
                    key={i}
                    type="button"
                    aria-label={m.goToSlide(i + 1)}
                    aria-current={i === index || undefined}
                    onClick={() => scrollTo(i)}
                    className="group cursor-pointer rounded-full p-1 outline-hidden"
                >
                    <span
                        aria-hidden
                        className={cx(
                            'block h-1.5 rounded-full transition-[width,background-color,box-shadow] duration-300',
                            'group-focus-visible:ring-2 group-focus-visible:ring-ring/50',
                            i === index
                                ? 'bg-primary w-5 shadow-[0_0_10px_oklch(var(--glow)/calc(0.7*var(--glow-k)))]'
                                : 'bg-tint/25 group-hover:bg-tint/40 w-1.5',
                        )}
                    />
                </button>
            ))}
        </div>
    );
}

export type CarouselProps = ComponentProps<'section'>;
