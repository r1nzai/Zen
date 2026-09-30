import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';

import type { DateRange } from '../utils/date';
import Calendar from './index';

const day = (label: RegExp | string) => screen.getByRole('button', { name: label });

describe('Calendar', () => {
    it('shows the month of the chosen date, marks it, and starts weeks on the locale’s first day', () => {
        render(<Calendar value="2026-09-30" onChange={() => {}} locale="en-US" />);
        expect(screen.getByRole('grid', { name: 'September 2026' })).toBeInTheDocument();
        expect(day('Wednesday, September 30, 2026')).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getAllByRole('columnheader')[0]).toHaveAttribute('abbr', 'Sunday');
        render(<Calendar value="2026-09-30" onChange={() => {}} locale="en-GB" />);
        expect(screen.getAllByRole('columnheader')[7]).toHaveAttribute('abbr', 'Monday');
    });

    it('picks a day', () => {
        const onChange = vi.fn();
        render(<Calendar value="2026-09-30" onChange={onChange} locale="en-US" />);
        fireEvent.click(day('Monday, September 14, 2026'));
        expect(onChange).toHaveBeenCalledWith('2026-09-14');
    });

    it('has one tab stop, moved by the keyboard across months', () => {
        render(<Calendar value="2026-09-30" onChange={() => {}} locale="en-US" />);
        const chosen = day('Wednesday, September 30, 2026');
        expect(chosen).toHaveAttribute('tabindex', '0');
        chosen.focus();
        fireEvent.keyDown(chosen, { key: 'ArrowRight' });
        expect(screen.getByRole('grid', { name: 'October 2026' })).toBeInTheDocument();
        expect(document.activeElement).toBe(day('Thursday, October 1, 2026'));
        fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
        expect(document.activeElement).toBe(day('Thursday, October 8, 2026'));
        fireEvent.keyDown(document.activeElement!, { key: 'Home' });
        expect(document.activeElement).toBe(day('Sunday, October 4, 2026'));
        fireEvent.keyDown(document.activeElement!, { key: 'PageUp', shiftKey: true });
        expect(document.activeElement).toBe(day('Saturday, October 4, 2025'));
    });

    it('the arrows change month; blocked days can’t be picked', () => {
        const onChange = vi.fn();
        render(
            <Calendar
                value={null}
                onChange={onChange}
                locale="en-US"
                defaultMonth="2026-09"
                min="2026-09-10"
                isDisabled={(d) => d === '2026-10-02'}
            />,
        );
        fireEvent.click(day('Tuesday, September 1, 2026'));
        expect(day('Tuesday, September 1, 2026')).toHaveAttribute('aria-disabled', 'true');
        fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
        fireEvent.click(day('Friday, October 2, 2026'));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('the title jumps to another month and year', () => {
        render(<Calendar value="2026-09-30" onChange={() => {}} locale="en-US" />);
        fireEvent.click(screen.getByRole('button', { name: /September 2026, choose month and year/ }));
        fireEvent.click(screen.getByRole('button', { name: 'Previous year' }));
        fireEvent.click(screen.getByRole('button', { name: 'March 2025' }));
        expect(screen.getByRole('grid', { name: 'March 2025' })).toBeInTheDocument();
    });

    it('range: a start, then an end (either way round), with the days between selected', () => {
        const onChange = vi.fn();
        function Range() {
            const [value, setValue] = useState<DateRange | null>(null);
            return (
                <Calendar
                    mode="range"
                    value={value}
                    onChange={(r) => {
                        setValue(r);
                        onChange(r);
                    }}
                    locale="en-US"
                    defaultMonth="2026-09"
                />
            );
        }
        render(<Range />);
        fireEvent.click(day('Thursday, September 10, 2026'));
        expect(onChange).toHaveBeenLastCalledWith({ start: '2026-09-10', end: null });
        fireEvent.click(day('Saturday, September 5, 2026'));
        expect(onChange).toHaveBeenLastCalledWith({ start: '2026-09-05', end: '2026-09-10' });
        expect(day('Monday, September 7, 2026').closest('td')).toHaveAttribute('aria-selected', 'true');
        expect(day('Friday, September 11, 2026').closest('td')).not.toHaveAttribute('aria-selected');
        fireEvent.click(day('Tuesday, September 15, 2026'));
        expect(onChange).toHaveBeenLastCalledWith({ start: '2026-09-15', end: null });
    });

    it('several months show side by side', () => {
        render(
            <Calendar mode="range" months={2} value={null} onChange={() => {}} locale="en-US" defaultMonth="2026-12" />,
        );
        expect(screen.getByRole('grid', { name: 'December 2026' })).toBeInTheDocument();
        expect(screen.getByRole('grid', { name: 'January 2027' })).toBeInTheDocument();
    });
});
