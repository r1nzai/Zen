import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';

import Disclosure, { DisclosureContent, DisclosureTrigger } from './index';

describe('Disclosure', () => {
    it('the trigger shows and hides the content, and says so', () => {
        render(
            <Disclosure>
                <DisclosureTrigger>Past (2)</DisclosureTrigger>
                <DisclosureContent>old goals</DisclosureContent>
            </Disclosure>,
        );
        const trigger = screen.getByRole('button', { name: 'Past (2)' });
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByText('old goals')).toBeNull();
        fireEvent.click(trigger);
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(trigger).toHaveAttribute('aria-controls', screen.getByText('old goals').id);
        fireEvent.click(trigger);
        expect(screen.queryByText('old goals')).toBeNull();
    });

    it('can follow your state', () => {
        function Controlled() {
            const [open, setOpen] = useState(true);
            return (
                <>
                    <Disclosure open={open} onOpenChange={setOpen}>
                        <DisclosureTrigger>Repaid</DisclosureTrigger>
                        <DisclosureContent>loans</DisclosureContent>
                    </Disclosure>
                    <span>{open ? 'shown' : 'hidden'}</span>
                </>
            );
        }
        render(<Controlled />);
        expect(screen.getByText('loans')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Repaid' }));
        expect(screen.getByText('hidden')).toBeInTheDocument();
        expect(screen.queryByText('loans')).toBeNull();
    });
});
