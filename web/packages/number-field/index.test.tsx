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
        expect(onValueChange).toHaveBeenLastCalledWith(2500.75, { reason: 'input' });
        fireEvent.change(field(), { target: { value: '' } });
        expect(onValueChange).toHaveBeenLastCalledWith(null, { reason: 'input' });
    });

    it('reads percentages as fractions', () => {
        const onValueChange = vi.fn();
        render(<NumberField aria-label="Rate" formatOptions={{ style: 'percent' }} onValueChange={onValueChange} />);
        fireEvent.focus(field());
        fireEvent.change(field(), { target: { value: '25%' } });
        expect(onValueChange).toHaveBeenLastCalledWith(0.25, { reason: 'input' });
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

    it('says whether a change was a step, and by how much, or typed', () => {
        const onValueChange = vi.fn();
        render(<NumberField aria-label="Count" defaultValue={3} min={0} max={9} onValueChange={onValueChange} />);
        fireEvent.click(screen.getByRole('button', { name: 'Increase' }));
        expect(onValueChange).toHaveBeenLastCalledWith(4, { reason: 'step', delta: 1 });
        fireEvent.keyDown(field(), { key: 'PageDown' });
        expect(onValueChange).toHaveBeenLastCalledWith(0, { reason: 'step', delta: -10 });
        fireEvent.keyDown(field(), { key: 'End' });
        expect(onValueChange).toHaveBeenLastCalledWith(9, { reason: 'limit' });
    });

    it('leaves the number to its owner: a step not taken up changes nothing', () => {
        const onValueChange = vi.fn();
        render(<NumberField aria-label="Count" value={3} onValueChange={onValueChange} />);
        fireEvent.click(screen.getByRole('button', { name: 'Decrease' }));
        expect(onValueChange).toHaveBeenLastCalledWith(2, { reason: 'step', delta: -1 });
        expect(field()).toHaveValue('3');
    });

    it('commits each step, and what is typed once, on Enter or on leaving', () => {
        const onValueCommit = vi.fn();
        render(<NumberField aria-label="Count" defaultValue={1} max={10} onValueCommit={onValueCommit} />);
        fireEvent.keyDown(field(), { key: 'ArrowUp' });
        expect(onValueCommit).toHaveBeenLastCalledWith(2, { reason: 'step', delta: 1 });
        fireEvent.focus(field());
        fireEvent.change(field(), { target: { value: '1' } });
        fireEvent.change(field(), { target: { value: '12' } });
        expect(onValueCommit).toHaveBeenCalledTimes(1);
        fireEvent.keyDown(field(), { key: 'Enter' });
        expect(onValueCommit).toHaveBeenLastCalledWith(10, { reason: 'input' });
        expect(field()).toHaveValue('10');
        fireEvent.blur(field());
        expect(onValueCommit).toHaveBeenCalledTimes(2);
        fireEvent.focus(field());
        fireEvent.change(field(), { target: { value: '7' } });
        fireEvent.blur(field());
        expect(onValueCommit).toHaveBeenLastCalledWith(7, { reason: 'input' });
        expect(onValueCommit).toHaveBeenCalledTimes(3);
    });

    it('commits what is typed when its owner takes up only finished changes', () => {
        const onValueCommit = vi.fn();
        render(<NumberField aria-label="Count" value={3} max={10} onValueCommit={onValueCommit} />);
        fireEvent.focus(field());
        fireEvent.change(field(), { target: { value: '7' } });
        fireEvent.keyDown(field(), { key: 'Enter' });
        expect(onValueCommit).toHaveBeenLastCalledWith(7, { reason: 'input' });
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
