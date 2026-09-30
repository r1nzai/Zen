import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';

import Field from '../field';
import type { DateRange } from '../utils/date';
import DatePicker, { DateRangePicker } from './index';

// jsdom has no Popover API: open the popup the way the browser reports it.
const open = (name: string) => {
    const trigger = screen.getByRole('button', { name });
    const popup = document.getElementById(trigger.getAttribute('aria-controls')!)!;
    act(() => {
        popup.dispatchEvent(Object.assign(new Event('toggle'), { newState: 'open' }));
    });
};

describe('DatePicker', () => {
    it('shows the date for the locale, or the placeholder', () => {
        const { rerender } = render(
            <DatePicker aria-label="Due" value="2026-09-30" onChange={() => {}} locale="en-GB" />,
        );
        expect(screen.getByRole('button', { name: 'Due' })).toHaveTextContent('30 Sept 2026');
        rerender(<DatePicker aria-label="Due" value={null} onChange={() => {}} locale="en-GB" />);
        expect(screen.getByRole('button', { name: 'Due' })).toHaveTextContent('Pick a date');
    });

    it('opens on the chosen date, and picking a day closes it', () => {
        const onChange = vi.fn();
        render(<DatePicker aria-label="Due" value="2026-09-30" onChange={onChange} locale="en-US" />);
        open('Due');
        const chosen = screen.getByRole('button', { name: 'Wednesday, September 30, 2026', hidden: true });
        expect(document.activeElement).toBe(chosen);
        fireEvent.click(screen.getByRole('button', { name: 'Friday, September 25, 2026', hidden: true }));
        expect(onChange).toHaveBeenCalledWith('2026-09-25');
        expect(screen.getByRole('button', { name: 'Due' })).toHaveAttribute('aria-expanded', 'false');
    });

    it('can be cleared', () => {
        const onClear = vi.fn();
        render(
            <DatePicker
                aria-label="Due"
                value="2026-09-30"
                onChange={() => {}}
                onClear={onClear}
                clearLabel="No due date"
                locale="en-US"
            />,
        );
        open('Due');
        fireEvent.click(screen.getByRole('button', { name: 'No due date', hidden: true }));
        expect(onClear).toHaveBeenCalled();
    });

    it('is wired to a Field', () => {
        render(
            <Field label="Start" error="Pick a start date.">
                <DatePicker value={null} onChange={() => {}} locale="en-US" />
            </Field>,
        );
        const trigger = screen.getByRole('button', { name: 'Start' });
        expect(trigger).toHaveAccessibleDescription('Pick a start date.');
        expect(trigger).toHaveAttribute('aria-invalid', 'true');
    });
});

describe('DateRangePicker', () => {
    it('stays open for the end, then closes, showing the range', () => {
        function Trip() {
            const [value, setValue] = useState<DateRange | null>(null);
            return <DateRangePicker aria-label="Trip" value={value} onChange={setValue} locale="en-US" />;
        }
        render(<Trip />);
        open('Trip');
        const trigger = screen.getByRole('button', { name: 'Trip' });
        const now = new Date();
        const first = screen.getAllByRole('button', { name: new RegExp(`, ${now.getFullYear()}$`), hidden: true });
        const pickable = first.filter((b) => !b.getAttribute('aria-disabled'));
        fireEvent.click(pickable[10]);
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(trigger).toHaveTextContent('– …');
        fireEvent.click(pickable[14]);
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(trigger).toHaveTextContent(/\d+\s*–\s*\d+/);
    });
});
