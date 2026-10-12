import { fireEvent, render, screen } from '@testing-library/react';

import TimeField from './index';

const part = (name: string) => screen.getByRole('spinbutton', { name });
const key = (name: string, k: string) => fireEvent.keyDown(part(name), { key: k });

describe('TimeField', () => {
    it('shows the parts in the locale’s order, with AM/PM where it uses a 12-hour clock', () => {
        render(<TimeField aria-label="Starts" defaultValue="15:05" locale="en-US" />);
        expect(screen.getByRole('group', { name: 'Starts' })).toHaveTextContent(/^3:05\sPM$/);
        expect(part('AM/PM')).toHaveTextContent('PM');
        render(<TimeField aria-label="Ends" defaultValue="15:05" locale="en-GB" />);
        expect(screen.getByRole('group', { name: 'Ends' })).toHaveTextContent('15:05');
    });

    it('typing digits fills a part and moves on when it is full', () => {
        const onValueChange = vi.fn();
        render(<TimeField aria-label="Starts" locale="en-GB" onValueChange={onValueChange} />);
        part('Hour').focus();
        key('Hour', '1');
        expect(part('Hour')).toHaveFocus();
        key('Hour', '4');
        expect(part('Minute')).toHaveFocus();
        key('Minute', '7');
        expect(onValueChange).toHaveBeenLastCalledWith('14:07');
    });

    it('is null until every part is set', () => {
        const onValueChange = vi.fn();
        render(<TimeField aria-label="Starts" locale="en-US" onValueChange={onValueChange} />);
        key('Hour', '9');
        key('Minute', '3');
        key('Minute', '0');
        expect(onValueChange).not.toHaveBeenCalled();
        key('AM/PM', 'p');
        expect(onValueChange).toHaveBeenLastCalledWith('21:30');
    });

    it('arrow keys step and wrap; minutes by `step`', () => {
        render(<TimeField aria-label="Starts" defaultValue="23:07" step={5} locale="en-GB" />);
        key('Hour', 'ArrowUp');
        expect(part('Hour')).toHaveTextContent('00');
        key('Minute', 'ArrowDown');
        expect(part('Minute')).toHaveTextContent('05');
        key('Minute', 'ArrowUp');
        expect(part('Minute')).toHaveTextContent('10');
    });

    it('Backspace clears a part, and the value with it', () => {
        const onValueChange = vi.fn();
        render(<TimeField aria-label="Starts" defaultValue="10:30" locale="en-GB" onValueChange={onValueChange} />);
        key('Minute', 'Backspace');
        expect(part('Minute')).toHaveTextContent('––');
        expect(onValueChange).toHaveBeenLastCalledWith(null);
    });

    it('←→ move between parts', () => {
        render(<TimeField aria-label="Starts" locale="en-GB" />);
        part('Hour').focus();
        key('Hour', 'ArrowRight');
        expect(part('Minute')).toHaveFocus();
        key('Minute', 'ArrowLeft');
        expect(part('Hour')).toHaveFocus();
    });

    it('submits "HH:MM" with a form', () => {
        render(
            <form data-testid="form">
                <TimeField aria-label="Starts" name="starts" defaultValue="08:15" />
            </form>,
        );
        expect(new FormData(screen.getByTestId('form') as HTMLFormElement).get('starts')).toBe('08:15');
    });
});
