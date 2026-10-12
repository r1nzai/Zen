import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';

import Combobox, { ComboboxTrigger } from '../combobox';
import ColorPicker from '../color-picker';
import DatePicker, { DateRangePicker } from '../date-picker';
import MoneyInput from '../money-input';
import MonthPicker from '../month-picker';
import RangeSlider from '../range-slider';
import RepeatPicker from '../repeat-picker';
import Select, { SelectItem } from '../select';
import Slider from '../slider';
import TagInput from '../tag-input';

const FRUIT = [
    { key: 'apple', text: 'Apple' },
    { key: 'pear', text: 'Pear' },
];

function Form() {
    return (
        <form aria-label="Entry">
            <Select aria-label="Kind" name="kind" defaultValue="out">
                <SelectItem value="in">In</SelectItem>
                <SelectItem value="out">Out</SelectItem>
            </Select>
            <DatePicker aria-label="Date" name="date" defaultValue="2026-09-30" locale="en-US" />
            <DateRangePicker
                aria-label="Trip"
                name="trip"
                defaultValue={{ start: '2026-09-01', end: '2026-09-05' }}
                locale="en-US"
            />
            <MonthPicker aria-label="Month" name="month" defaultValue="2026-09" locale="en-US" />
            <MoneyInput aria-label="Amount" name="amount" defaultValue={1250} currency="USD" locale="en-US" />
            <ColorPicker aria-label="Colour" name="colour" defaultValue="#ff0000" />
            <TagInput aria-label="Tags" name="tags" defaultValue={['food', 'trip']} />
            <Combobox items={FRUIT} multiple name="fruit" defaultValue={['pear']}>
                <ComboboxTrigger aria-label="Fruit" />
            </Combobox>
            <RepeatPicker name="repeat" defaultValue={{ every: 2, unit: 'week' }} locale="en-US" />
            <Slider aria-label="Share" name="share" defaultValue={40} />
            <RangeSlider label="Price" name="price" defaultValue={[10, 90]} />
        </form>
    );
}

const data = () => new FormData(screen.getByRole('form', { name: 'Entry' }) as HTMLFormElement);

describe('custom controls in a form', () => {
    it('submit their values under their names', () => {
        render(<Form />);
        const form = data();
        expect(form.get('kind')).toBe('out');
        expect(form.get('date')).toBe('2026-09-30');
        expect(form.get('trip')).toBe('2026-09-01/2026-09-05');
        expect(form.get('month')).toBe('2026-09');
        expect(form.get('amount')).toBe('1250');
        expect(form.get('colour')).toBe('#ff0000');
        expect(form.getAll('tags')).toEqual(['food', 'trip']);
        expect(form.getAll('fruit')).toEqual(['pear']);
        expect(JSON.parse(form.get('repeat') as string)).toEqual({ every: 2, unit: 'week' });
        expect(form.get('share')).toBe('40');
        expect(form.getAll('price')).toEqual(['10', '90']);
    });

    it('go back to their first values when the form is reset', () => {
        render(<Form />);
        fireEvent.change(screen.getByRole('slider', { name: 'Share' }), { target: { value: '70' } });
        fireEvent.change(screen.getByRole('slider', { name: 'Minimum' }), { target: { value: '30' } });
        fireEvent.click(screen.getByRole('button', { name: 'Remove food' }));
        expect(data().get('share')).toBe('70');
        expect(data().getAll('tags')).toEqual(['trip']);
        act(() => (screen.getByRole('form', { name: 'Entry' }) as HTMLFormElement).reset());
        expect(data().get('share')).toBe('40');
        expect(data().getAll('price')).toEqual(['10', '90']);
        expect(data().getAll('tags')).toEqual(['food', 'trip']);
    });
});
