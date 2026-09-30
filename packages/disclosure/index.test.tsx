import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';

import Disclosure, { DisclosureContent, DisclosureTrigger } from './index';

describe('Disclosure', () => {
    it('the trigger shows and hides the content, and says so', async () => {
        render(
            <Disclosure>
                <DisclosureTrigger>Past (2)</DisclosureTrigger>
                <DisclosureContent>old goals</DisclosureContent>
            </Disclosure>,
        );
        const trigger = screen.getByRole('button', { name: 'Past (2)' });
        // Closed: not in the page at all.
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(trigger).not.toHaveAttribute('aria-controls');
        expect(screen.queryByText('old goals')).toBeNull();
        fireEvent.click(trigger);
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        const content = document.getElementById(trigger.getAttribute('aria-controls')!)!;
        expect(content).toHaveAttribute('data-open');
        expect(content).not.toHaveAttribute('inert');
        expect(content).toContainElement(screen.getByText('old goals'));
        // Closing: inert while it folds shut, then gone.
        fireEvent.click(trigger);
        expect(content).toHaveAttribute('inert');
        await waitFor(() => expect(screen.queryByText('old goals')).toBeNull());
    });

    it('stays until its fold-shut transition ends, and a reopen meanwhile keeps it', async () => {
        let finish!: () => void;
        const finished = new Promise<void>((done) => (finish = done));
        HTMLElement.prototype.getAnimations = () => [{ finished } as unknown as Animation];
        try {
            render(
                <Disclosure defaultOpen>
                    <DisclosureTrigger>Past</DisclosureTrigger>
                    <DisclosureContent>old goals</DisclosureContent>
                </Disclosure>,
            );
            const trigger = screen.getByRole('button', { name: 'Past' });
            fireEvent.click(trigger);
            await Promise.resolve();
            expect(screen.getByText('old goals')).toBeInTheDocument();
            fireEvent.click(trigger); // reopened before it finished folding
            finish();
            await finished;
            await Promise.resolve();
            expect(screen.getByText('old goals').closest('[inert]')).toBeNull();
        } finally {
            delete (HTMLElement.prototype as Partial<HTMLElement>).getAnimations;
        }
    });

    it('can follow your state', async () => {
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
        await waitFor(() => expect(screen.queryByText('loans')).toBeNull());
    });
});
