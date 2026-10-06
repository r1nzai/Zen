import { fireEvent, render, screen } from '@testing-library/react';

import CalendarHeatmap from './index';

describe('CalendarHeatmap', () => {
    const values = { '2026-09-03': 4200, '2026-09-12': 16450 } as const;

    it('lays the month out in weeks from the locale week start, labelled by the month', () => {
        render(<CalendarHeatmap month="2026-09" values={values} locale="en-GB" />);
        const table = screen.getByRole('table', { name: 'September 2026' });
        expect(screen.getAllByRole('columnheader')[0]).toHaveAttribute('abbr', 'Monday');
        // 1 Sep 2026 is a Tuesday: one blank before it in a Monday-first week.
        const firstWeek = table.querySelectorAll('tbody tr')[0].querySelectorAll('td');
        expect(firstWeek[0]).toBeEmptyDOMElement();
        expect(firstWeek[1]).toHaveTextContent('1');
    });

    it('shades days by value, the biggest day fullest, days without one plain', () => {
        const { container } = render(<CalendarHeatmap month="2026-09" values={values} locale="en-US" />);
        const shade = (day: string) =>
            (container.querySelector(`td[title^="${day}"] span`) as HTMLElement).style.background;
        expect(shade('Sep 12')).toBe('oklch(var(--primary) / 0.95)');
        expect(shade('Sep 3')).toMatch(/oklch\(var\(--primary\) \/ 0\.5\d*\)/);
        expect(shade('Sep 4')).toBe('');
    });

    it('says each day and its figure; with onSelect, days are buttons', () => {
        const onSelect = vi.fn();
        render(
            <CalendarHeatmap
                month="2026-09"
                values={values}
                locale="en-US"
                format={(v) => `$${v / 100}`}
                onSelect={onSelect}
                selected="2026-09-03"
            />,
        );
        expect(screen.getByRole('button', { name: 'Sep 3: $42' })).toHaveAttribute('aria-pressed', 'true');
        fireEvent.click(screen.getByRole('button', { name: 'Sep 12: $164.5' }));
        expect(onSelect).toHaveBeenCalledWith('2026-09-12');
    });
});
