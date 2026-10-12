import { fireEvent, render, screen } from '@testing-library/react';

import NumberField from './index';

const field = () => screen.getByRole('spinbutton');

describe('NumberField', () => {
    it('is a spin button showing the number the locale’s way', () => {
        render(<NumberField aria-label="Amount" defaultValue={1234.5} min={0} max={5000} locale="de-DE" />);
        expect(field()).toHaveValue('1.234,5');
        expect(field()).toHaveAttribute('aria-valuenow', '1234.5');
        expect(field()).toHaveAttribute('aria-valuemin', '0');
        expect(field()).toHaveAttribute('aria-valuemax', '5000');
    });

    it('reads what is typed, separators and all', () => {
        const onValueChange = vi.fn();
        render(<NumberField aria-label="Amount" locale="de-DE" onValueChange={onValueChange} />);
        fireEvent.focus(field());
        fireEvent.change(field(), { target: { value: '2.500,75' } });
        expect(onValueChange).toHaveBeenLastCalledWith(2500.75);
        fireEvent.change(field(), { target: { value: '' } });
        expect(onValueChange).toHaveBeenLastCalledWith(null);
    });

    it('reads percentages as fractions', () => {
        const onValueChange = vi.fn();
        render(<NumberField aria-label="Rate" formatOptions={{ style: 'percent' }} onValueChange={onValueChange} />);
        fireEvent.focus(field());
        fireEvent.change(field(), { target: { value: '25%' } });
        expect(onValueChange).toHaveBeenLastCalledWith(0.25);
    });

    it('arrow keys step without float drift; Page keys take large steps; Home and End go to the ends', () => {
        render(<NumberField aria-label="Rate" defaultValue={0.1} step={0.1} min={0} max={10} />);
        fireEvent.keyDown(field(), { key: 'ArrowUp' });
        fireEvent.keyDown(field(), { key: 'ArrowUp' });
        expect(field()).toHaveAttribute('aria-valuenow', '0.3');
        fireEvent.keyDown(field(), { key: 'PageUp' });
        expect(field()).toHaveAttribute('aria-valuenow', '1.3');
        fireEvent.keyDown(field(), { key: 'End' });
        expect(field()).toHaveAttribute('aria-valuenow', '10');
        fireEvent.keyDown(field(), { key: 'ArrowUp' });
        expect(field()).toHaveAttribute('aria-valuenow', '10');
        fireEvent.keyDown(field(), { key: 'Home' });
        expect(field()).toHaveAttribute('aria-valuenow', '0');
    });

    it('− and + step, and stop at the ends', () => {
        render(<NumberField aria-label="Guests" defaultValue={1} min={1} max={2} />);
        expect(screen.getByRole('button', { name: 'Decrease' })).toBeDisabled();
        fireEvent.click(screen.getByRole('button', { name: 'Increase' }));
        expect(field()).toHaveValue('2');
        expect(screen.getByRole('button', { name: 'Increase' })).toBeDisabled();
    });

    it('keeps within min and max once you leave it', () => {
        render(<NumberField aria-label="Guests" min={1} max={8} />);
        fireEvent.focus(field());
        fireEvent.change(field(), { target: { value: '20' } });
        fireEvent.blur(field());
        expect(field()).toHaveValue('8');
    });

    it('starts stepping from min when empty', () => {
        render(<NumberField aria-label="Guests" min={2} />);
        fireEvent.keyDown(field(), { key: 'ArrowUp' });
        expect(field()).toHaveValue('2');
    });

    it('submits the number with a form', () => {
        render(
            <form data-testid="form">
                <NumberField aria-label="Guests" name="guests" defaultValue={3} />
            </form>,
        );
        expect(new FormData(screen.getByTestId('form') as HTMLFormElement).get('guests')).toBe('3');
    });
});
