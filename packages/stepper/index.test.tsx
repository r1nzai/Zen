import { render, screen } from '@testing-library/react';

import Stepper, { Step } from './index';

describe('Stepper', () => {
    it('marks the steps before the value done and the one at it current', () => {
        render(
            <Stepper value={1}>
                <Step>Upload</Step>
                <Step>Map</Step>
                <Step>Review</Step>
            </Stepper>,
        );
        const steps = screen.getAllByRole('listitem');
        expect(steps.map((s) => s.dataset.state)).toEqual(['done', 'current', 'upcoming']);
        expect(steps[1]).toHaveAttribute('aria-current', 'step');
        expect(steps[0]).toHaveTextContent(', done');
    });
});
