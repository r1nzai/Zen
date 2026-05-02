import { render, screen } from '@testing-library/react';
import { useRef } from 'react';
import Collapse from './index';

// ── Global mocks ──────────────────────────────────────────────────────────────

class MockResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    font: '',
    measureText: vi.fn(() => ({ width: 50 })),
})) as never;

// ── Helpers ───────────────────────────────────────────────────────────────────

const ITEMS = ['Alpha', 'Beta', 'Gamma', 'Delta'];

function renderChildren(item: string) {
    return <span key={item}>{item}</span>;
}

/** Wrapper that provides a real ref whose offsetWidth we can control via a spy. */
function CollapseWithRef({ width }: { width: number }) {
    const ref = useRef<HTMLDivElement>(null);
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(width);
    return (
        <div ref={ref} style={{ width }}>
            <Collapse items={ITEMS} parentRef={ref} moreItemsLabel="more">
                {renderChildren}
            </Collapse>
        </div>
    );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Collapse', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('when the container is wide enough', () => {
        it('renders all items', () => {
            render(<CollapseWithRef width={9999} />);
            for (const item of ITEMS) {
                expect(screen.getByText(item)).toBeInTheDocument();
            }
        });

        it('does not render the overflow badge', () => {
            render(<CollapseWithRef width={9999} />);
            expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
        });
    });

    describe('when the container is too narrow', () => {
        it('renders the overflow badge with a count', () => {
            render(<CollapseWithRef width={1} />);
            const badge = screen.getByText(/^\+\d/);
            expect(badge).toBeInTheDocument();
        });

        it('badge text includes the moreItemsLabel', () => {
            render(<CollapseWithRef width={1} />);
            expect(screen.getByText(/more/i)).toBeInTheDocument();
        });
    });

    describe('children render prop', () => {
        it('is called for each visible item', () => {
            const children = vi.fn((item: string) => <span key={item}>{item}</span>);
            function Wrapper() {
                const ref = useRef<HTMLDivElement>(null);
                vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(9999);
                return (
                    <div ref={ref}>
                        <Collapse items={ITEMS} parentRef={ref}>
                            {children}
                        </Collapse>
                    </div>
                );
            }
            render(<Wrapper />);
            expect(children.mock.calls.length).toBeGreaterThanOrEqual(ITEMS.length);
            ITEMS.forEach((item) => {
                expect(children).toHaveBeenCalledWith(item, expect.any(Number), undefined);
            });
        });
    });
});
