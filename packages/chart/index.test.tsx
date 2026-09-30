import { fireEvent, render, screen, within } from '@testing-library/react';

import Chart, { ChartArea, ChartBar, ChartLine, ChartReference, DonutChart, niceTicks } from './index';

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

    it('focusing a segment shows its tooltip', () => {
        render(<DonutChart items={ITEMS} label="Spending" formatValue={(v) => `₹${v}`} />);
        fireEvent.focus(screen.getByRole('listitem', { name: /Food/ }));
        expect(screen.getByText('30%')).toBeInTheDocument();
        expect(screen.getByText('₹30')).toBeInTheDocument();
    });
});
