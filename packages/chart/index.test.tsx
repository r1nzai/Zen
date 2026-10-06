import { fireEvent, render, screen, within } from '@testing-library/react';

import Chart, {
    AllocationBar,
    ChartArea,
    ChartBar,
    ChartLine,
    ChartReference,
    DonutChart,
    niceTicks,
    paletteColor,
} from './index';

// jsdom has no layout: give the chart a width to draw into.
beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 600 });
});
afterAll(() => {
    delete (HTMLElement.prototype as { clientWidth?: number }).clientWidth;
});

const DATA = [
    { month: 'Jan', income: 100, spending: 80, past: 10, ahead: null },
    { month: 'Feb', income: 120, spending: 90, past: 20, ahead: null },
    { month: 'Mar', income: 110, spending: 130, past: 15, ahead: 15 },
    { month: 'Apr', income: 140, spending: 70, past: null, ahead: 25 },
];

const plot = () => screen.getByLabelText(/use the arrow keys/);

describe('niceTicks', () => {
    it('covers the range in round steps', () => {
        expect(niceTicks(0, 130)).toEqual([0, 20, 40, 60, 80, 100, 120, 140]);
        expect(niceTicks(0, 1_000_000)).toEqual([0, 200_000, 400_000, 600_000, 800_000, 1_000_000]);
        expect(niceTicks(-30, 95)).toEqual([-40, -20, 0, 20, 40, 60, 80, 100]);
        expect(niceTicks(5, 5)).toEqual([0, 1, 2, 3, 4, 5]);
    });
});

describe('Chart', () => {
    it('is a named figure with a table of every value for screen readers', () => {
        render(
            <Chart data={DATA} x="month" label="Cash flow" summary="April was the best month.">
                <ChartBar dataKey="income" label="Income" />
                <ChartBar dataKey="spending" label="Spending" />
            </Chart>,
        );
        expect(screen.getByRole('figure', { name: 'Cash flow' })).toHaveTextContent('April was the best month.');
        const table = screen.getByRole('table', { name: 'Cash flow' });
        // Hidden by its box: sr-only on a table itself can't shrink it, so it widens a phone's page.
        expect(table.parentElement).toHaveClass('sr-only');
        expect(table).not.toHaveClass('sr-only');
        const rows = within(table).getAllByRole('row');
        expect(rows[0]).toHaveTextContent('monthIncomeSpending');
        expect(rows[4]).toHaveTextContent('Apr14070');
    });

    it('a legend for two or more series (keyed by mark), none for one', () => {
        const { rerender } = render(
            <Chart data={DATA} x="month" label="C">
                <ChartBar dataKey="income" label="Income" />
                <ChartLine dataKey="spending" label="Spending" />
            </Chart>,
        );
        expect(within(screen.getByRole('list', { name: 'Legend' })).getAllByRole('listitem')).toHaveLength(2);
        rerender(
            <Chart data={DATA} x="month" label="C">
                <ChartArea dataKey="income" label="Income" />
            </Chart>,
        );
        expect(screen.queryByRole('list', { name: 'Legend' })).toBeNull();
    });

    it('explains faded bars in the legend, once, even for one series', () => {
        const future = (_: unknown, i: number) => i > 1;
        const { rerender } = render(
            <Chart data={DATA} x="month" label="C">
                <ChartBar dataKey="income" label="Income" dim={future} dimLabel="Planned" />
            </Chart>,
        );
        const items = () => within(screen.getByRole('list', { name: 'Legend' })).getAllByRole('listitem');
        expect(items().map((li) => li.textContent)).toEqual(['Income', 'Planned']);
        rerender(
            <Chart data={DATA} x="month" label="C">
                <ChartBar dataKey="income" label="Income" dim={future} dimLabel="Planned" />
                <ChartBar dataKey="spending" label="Spending" dim={future} dimLabel="Planned" />
            </Chart>,
        );
        expect(items().map((li) => li.textContent)).toEqual(['Income', 'Spending', 'Planned']);
    });

    it('colours in shades of the theme glow with palette="glow"', () => {
        const { container } = render(
            <Chart data={DATA} x="month" label="C" palette="glow">
                <ChartLine dataKey="income" label="Income" />
                <ChartLine dataKey="spending" label="Spending" />
            </Chart>,
        );
        const [first, last] = container.querySelectorAll<SVGPathElement>('svg path[fill="none"]');
        // First to second glow colour, the later ones deeper.
        expect(first.getAttribute('style')).toContain('var(--glow)), oklch(var(--glow-2)) 0%');
        expect(last.getAttribute('style')).toContain('oklch(var(--glow-2)) 100%), oklch(var(--background)) 45%');
    });

    it('colours series from the palette in order, unless given one', () => {
        const { container } = render(
            <Chart data={DATA} x="month" label="C">
                <ChartLine dataKey="income" label="Income" />
                <ChartLine dataKey="spending" label="Spending" color="red" />
            </Chart>,
        );
        const lines = container.querySelectorAll<SVGPathElement>('svg path[fill="none"]');
        expect(lines[0].style.stroke).toBe('var(--chart-1)');
        expect(lines[1].style.stroke).toBe('red');
    });

    it('the keyboard reads each row: a tooltip lists every series there', () => {
        render(
            <Chart data={DATA} x="month" label="C" formatY={(v) => `₹${v}`}>
                <ChartBar dataKey="income" label="Income" />
                <ChartLine dataKey="spending" label="Spending" />
            </Chart>,
        );
        fireEvent.keyDown(plot(), { key: 'ArrowRight' });
        expect(plot()).toHaveTextContent(/JanIncome₹100Spending₹80/);
        fireEvent.keyDown(plot(), { key: 'End' });
        expect(plot()).toHaveTextContent(/AprIncome₹140Spending₹70/);
        fireEvent.keyDown(plot(), { key: 'Escape' });
        expect(plot()).not.toHaveTextContent('Income');
    });

    it('a null breaks a line, so one series can be solid then dashed', () => {
        const { container } = render(
            <Chart data={DATA} x="month" label="C">
                <ChartArea dataKey="past" label="Balance" />
                <ChartArea dataKey="ahead" label="Projected" dashed />
            </Chart>,
        );
        const strokes = container.querySelectorAll('svg path[fill="none"]');
        expect(strokes).toHaveLength(2);
        expect(strokes[1]).toHaveAttribute('stroke-dasharray', '5 5');
        // The fill under each part.
        expect(container.querySelectorAll('svg path[fill^="url("]')).toHaveLength(2);
    });

    it('fades dimmed bars, and marks a row with a labelled reference', () => {
        const { container } = render(
            <Chart data={DATA} x="month" label="C">
                <ChartBar dataKey="income" label="Income" dim={(_, i) => i === 3} />
                <ChartReference x="Mar" label="Today" />
                <ChartReference y={0} />
            </Chart>,
        );
        const bars = container.querySelectorAll<SVGPathElement>('path.zen__chart-grow');
        expect(bars).toHaveLength(4);
        expect(Number(bars[3].style.opacity)).toBeLessThan(Number(bars[0].style.opacity));
        expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it("a reference's label sits left of its line, or right where the y-axis labels would be in the way", () => {
        render(
            <Chart data={DATA} x="month" label="C">
                <ChartLine dataKey="income" label="Income" />
                <ChartReference x="Jan" label="Today" />
                <ChartReference x="Apr" label="Goal" />
            </Chart>,
        );
        expect(screen.getByText('Today')).toHaveAttribute('text-anchor', 'start');
        expect(screen.getByText('Goal')).toHaveAttribute('text-anchor', 'end');
    });
});

describe('DonutChart', () => {
    const ITEMS = [
        { key: 'a', label: 'Home', value: 60 },
        { key: 'b', label: 'Food', value: 30 },
        { key: 'c', label: 'Fun', value: 10 },
    ];

    it('a segment per part, each named with its value and share', () => {
        render(
            <DonutChart items={ITEMS} label="Spending" formatValue={(v) => `₹${v}`}>
                Total
            </DonutChart>,
        );
        const list = screen.getByRole('list', { name: 'Spending' });
        expect(
            within(list)
                .getAllByRole('listitem')
                .map((s) => s.getAttribute('aria-label')),
        ).toEqual(['Home: ₹60 (60%)', 'Food: ₹30 (30%)', 'Fun: ₹10 (10%)']);
        expect(screen.getByText('Total')).toBeInTheDocument();
    });

    it('one part is a whole ring, with no notch where its ends would meet', () => {
        render(<DonutChart items={[{ key: 'emi', label: 'EMI', value: 32748 }]} label="Planned" />);
        const ring = screen.getByRole('listitem', { name: /EMI/ });
        // Drawn as two full circles (outer and inner edge), not a sector with rounded ends.
        expect(ring.getAttribute('d')!.match(/M/g)).toHaveLength(2);
    });

    it('draws every part with a value, however small, with no hole in the ring', () => {
        const items = [
            { key: 'home', label: 'Home', value: 107557 },
            { key: 'emi', label: 'EMI', value: 32748 },
            { key: 'food', label: 'Food', value: 30000 },
            // 1.4%: thinner than the gap and rounding take off a segment's ends.
            { key: 'fun', label: 'Fun', value: 2421 },
            { key: 'gifts', label: 'Gifts', value: 0 },
        ];
        render(<DonutChart items={items} label="Planned" size={160} />);
        const parts = screen.getAllByRole('listitem');
        expect(parts.map((p) => p.getAttribute('aria-label')!.split(':')[0])).toEqual(['Home', 'EMI', 'Food', 'Fun']);
        // The angles each segment's outer edge runs between (a pill's is one point).
        const edges = parts.map((p) => {
            const [, x0, y0, x1 = x0, y1 = y0] = p
                .getAttribute('d')!
                .match(/^M([-\d.]+),([-\d.]+)(?:A80,80 \d \d \d ([-\d.]+),([-\d.]+))?/)!;
            return [Math.atan2(+y0, +x0), Math.atan2(+y1, +x1)];
        });
        const turn = (a: number) => (a + 2 * Math.PI) % (2 * Math.PI);
        // Neighbours are all parted by the same gap, so no part's room is left empty.
        const gaps = edges.map(([, end], i) => turn(edges[(i + 1) % edges.length][0] - end));
        gaps.forEach((gap) => expect(gap).toBeCloseTo(gaps[0], 3));
        // The larger parts make room for the smallest, and keep their proportions.
        const sweeps = edges.map(([start, end]) => turn(end - start) + gaps[0]);
        expect(sweeps[0] / sweeps[1]).toBeCloseTo(107557 / 32748, 3);
        expect(sweeps[1] / sweeps[2]).toBeCloseTo(32748 / 30000, 3);
    });

    it('draws each segment once, so a translucent colour has no lighter rim', () => {
        render(
            <DonutChart items={ITEMS.map((it) => ({ ...it, color: 'oklch(0.7 0.2 300 / 0.5)' }))} label="Spending" />,
        );
        for (const part of screen.getAllByRole('listitem')) {
            expect(part.style.stroke).toBe('');
            expect(part).not.toHaveAttribute('stroke-width');
            expect(part.getAttribute('d')!.match(/M/g)).toHaveLength(1);
        }
    });

    it('stacks what you put in the middle together', () => {
        render(
            <DonutChart items={ITEMS} label="Spending">
                <div>Planned</div>
                <div>₹32.7K</div>
            </DonutChart>,
        );
        expect(screen.getByText('Planned').parentElement).toHaveClass('flex-col', 'justify-center');
    });

    it('draws each part in paletteColor, so a legend of your own matches', () => {
        render(<DonutChart items={ITEMS} label="Spending" palette="glow" />);
        const parts = screen.getAllByRole('listitem');
        parts.forEach((part, i) =>
            expect(part.style.fill).toBe(paletteColor('glow', i, ITEMS.length).replace(/\s+/g, ' ')),
        );
    });

    it('focusing a segment shows its tooltip', () => {
        render(<DonutChart items={ITEMS} label="Spending" formatValue={(v) => `₹${v}`} />);
        fireEvent.focus(screen.getByRole('listitem', { name: /Food/ }));
        expect(screen.getByText('30%')).toBeInTheDocument();
        expect(screen.getByText('₹30')).toBeInTheDocument();
    });
});

describe('AllocationBar', () => {
    const items = [
        { key: 'a', label: 'Bills', value: 300 },
        { key: 'b', label: 'Savings', value: 100 },
        { key: 'c', label: 'Gifts', value: 0 },
    ];

    it('reads out every part with its share, and splits the bar by value', () => {
        const { container } = render(<AllocationBar label="Income" items={items} locale="en-US" />);
        expect(screen.getByRole('img')).toHaveAccessibleName('Income. Bills: 300, 75%; Savings: 100, 25%');
        const parts = container.querySelectorAll<HTMLElement>('[role=img] > span');
        expect([...parts].map((p) => p.style.flexGrow)).toEqual(['300', '100']);
        expect(screen.getByText('Gifts')).toBeInTheDocument();
    });

    it('picks out the part pointed at, in the bar or the legend', () => {
        const { container } = render(<AllocationBar label="Income" items={items} locale="en-US" />);
        fireEvent.pointerEnter(screen.getByText('Savings').closest('li')!);
        const [bills, savings] = container.querySelectorAll('[role=img] > span');
        expect(savings).toHaveAttribute('data-active');
        expect(bills).toHaveAttribute('data-dimmed');
    });
});
