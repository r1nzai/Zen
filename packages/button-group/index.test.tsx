import { render, screen } from '@testing-library/react';

import Button from '@zen/button';

import ButtonGroup from './index';

describe('ButtonGroup', () => {
    it('is a group of its buttons, taking other props', () => {
        render(
            <ButtonGroup aria-label="Month" id="g">
                <Button>Previous</Button>
                <Button>Next</Button>
            </ButtonGroup>,
        );
        const group = screen.getByRole('group', { name: 'Month' });
        expect(group).toHaveAttribute('id', 'g');
        expect(group).toContainElement(screen.getByRole('button', { name: 'Next' }));
        expect(group).toHaveAttribute('data-orientation', 'horizontal');
    });
});
