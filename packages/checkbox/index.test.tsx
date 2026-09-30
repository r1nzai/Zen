import { fireEvent, render, screen } from '@testing-library/react';

import Field from '../field';
import Checkbox from './index';

describe('Checkbox', () => {
    it('is a native checkbox named by its children, reporting checked', () => {
        const onChange = vi.fn();
        render(
            <Checkbox checked={false} onChange={onChange} description="Once a month.">
                Remind me
            </Checkbox>,
        );
        const box = screen.getByRole('checkbox', { name: /Remind me/ });
        fireEvent.click(box);
        expect(onChange).toHaveBeenCalledWith(true);
        expect(screen.getByText('Once a month.')).toBeInTheDocument();
    });

    it('indeterminate is set on the element and announced as mixed', () => {
        const { rerender } = render(<Checkbox aria-label="All" checked={false} indeterminate onChange={() => {}} />);
        const box = screen.getByRole('checkbox', { name: 'All' }) as HTMLInputElement;
        expect(box.indeterminate).toBe(true);
        expect(box).toHaveAttribute('aria-checked', 'mixed');
        rerender(<Checkbox aria-label="All" checked onChange={() => {}} />);
        expect(box.indeterminate).toBe(false);
        expect(box).toBeChecked();
    });

    it('can be disabled', () => {
        render(<Checkbox disabled>Sync</Checkbox>);
        expect(screen.getByRole('checkbox', { name: 'Sync' })).toBeDisabled();
    });

    it('is wired to a Field', () => {
        render(
            <Field label="Terms" error="You need to accept the terms.">
                <Checkbox />
            </Field>,
        );
        const box = screen.getByRole('checkbox', { name: 'Terms' });
        expect(box).toHaveAccessibleDescription('You need to accept the terms.');
        expect(box).toHaveAttribute('aria-invalid', 'true');
    });
});
