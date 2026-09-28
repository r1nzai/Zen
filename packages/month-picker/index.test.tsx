import { fireEvent, render, screen } from '@testing-library/react';

import MonthPicker from './index';

describe('MonthPicker', () => {
    it('shows the month for the locale', () => {
        render(<MonthPicker aria-label="Start" value="2026-09" onChange={() => {}} locale="en-US" />);
        expect(screen.getByRole('button', { name: 'Start' })).toHaveTextContent('Sep 2026');
    });

    it('picks a month from the grid, in the shown year', () => {
        const onChange = vi.fn();
        render(<MonthPicker aria-label="Start" value="2026-09" onChange={onChange} locale="en-US" />);
        fireEvent.click(screen.getByRole('button', { name: 'Next year', hidden: true }));
        fireEvent.click(screen.getByRole('button', { name: 'March 2027', hidden: true }));
        expect(onChange).toHaveBeenCalledWith('2027-03');
    });

    it('marks the chosen month and disables months out of range', () => {
        render(
            <MonthPicker
                aria-label="Start"
                value="2026-09"
                onChange={() => {}}
                locale="en-US"
                min="2026-06"
                max="2026-10"
            />,
        );
        expect(screen.getByRole('button', { name: 'September 2026', hidden: true })).toHaveAttribute(
            'aria-pressed',
            'true',
        );
        expect(screen.getByRole('button', { name: 'May 2026', hidden: true })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'November 2026', hidden: true })).toBeDisabled();
    });

    it('offers clearing when a month is set', () => {
        const onClear = vi.fn();
        render(
            <MonthPicker
                aria-label="End"
                value="2026-09"
                onChange={() => {}}
                locale="en-US"
                onClear={onClear}
                clearLabel="No end"
            />,
        );
        fireEvent.click(screen.getByRole('button', { name: 'No end', hidden: true }));
        expect(onClear).toHaveBeenCalled();
    });

    it('shows the placeholder without a value', () => {
        render(
            <MonthPicker aria-label="End" value={null} onChange={() => {}} locale="en-US" placeholder="Open-ended" />,
        );
        expect(screen.getByRole('button', { name: 'End' })).toHaveTextContent('Open-ended');
    });
});
