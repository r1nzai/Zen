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
        const content = document.getElementById(trigger.getAttribute('aria-controls')!)!;
        // Closed: in the page (so it can animate) but inert.
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(content).toHaveAttribute('inert');
        expect(content).toContainElement(screen.getByText('old goals'));
        fireEvent.click(trigger);
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(content).not.toHaveAttribute('inert');
        expect(content).toHaveAttribute('data-open');
        fireEvent.click(trigger);
        expect(content).toHaveAttribute('inert');
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
        expect(screen.getByText('loans').closest('[inert]')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Repaid' }));
        expect(screen.getByText('hidden')).toBeInTheDocument();
        expect(screen.getByText('loans').closest('[inert]')).not.toBeNull();
    });
});
