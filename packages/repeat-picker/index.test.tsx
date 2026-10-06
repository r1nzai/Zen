import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';

import type { Repeat } from '../utils/repeat';
import RepeatPicker from './index';

function Picker({ initial, onChange = () => {} }: { initial: Repeat; onChange?: (r: Repeat) => void }) {
    const [value, setValue] = useState(initial);
    return (
        <RepeatPicker
            value={value}
            onChange={(r) => {
                setValue(r);
                onChange(r);
            }}
            locale="en-US"
            start="2026-03-04"
        />
    );
}

describe('RepeatPicker', () => {
    it('says what it means and when it falls next', () => {
        render(<Picker initial={{ every: 1, unit: 'month', day: 5 }} />);
        expect(screen.getByText(/Every month on day 5/)).toHaveTextContent(
            'Next: Mar 5, 2026, Apr 5, 2026, May 5, 2026',
        );
    });

    it('changes how many, ignoring what is not a number', () => {
        const onChange = vi.fn();
        render(<Picker initial={{ every: 1, unit: 'day' }} onChange={onChange} />);
        fireEvent.change(screen.getByRole('textbox', { name: 'How many' }), { target: { value: '3x' } });
        expect(onChange).toHaveBeenLastCalledWith({ every: 3, unit: 'day' });
        expect(screen.getByText(/Every 3 days/)).toBeInTheDocument();
    });

    it('picks weekdays, keeping at least one', () => {
        const onChange = vi.fn();
        render(<Picker initial={{ every: 1, unit: 'week', weekdays: [3] }} onChange={onChange} />);
        const wed = screen.getByRole('button', { name: 'Wed' });
        expect(wed).toHaveAttribute('aria-pressed', 'true');
        fireEvent.click(wed);
        expect(onChange).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Fri' }));
        expect(onChange).toHaveBeenLastCalledWith({ every: 1, unit: 'week', weekdays: [3, 5] });
        expect(screen.getByText(/Every week on Wed, Fri/)).toBeInTheDocument();
    });
});
