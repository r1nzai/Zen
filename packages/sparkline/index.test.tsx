import { render, screen } from '@testing-library/react';

import Sparkline from './index';

describe('Sparkline', () => {
    it('draws the values from left to right, low to high, and says how they moved', () => {
        render(<Sparkline values={[10, 30, 20]} />);
        const svg = screen.getByRole('img', { name: 'From 10 to 20' });
        const line = svg.querySelector('path.zen__sparkline-draw')!;
        expect(line.getAttribute('d')).toBe('M0.00,38.00L50.00,2.00L100.00,20.00');
    });

    it('draws nothing for fewer than two values, and a flat line for equal ones', () => {
        const { container, rerender } = render(<Sparkline values={[5]} />);
        expect(container).toBeEmptyDOMElement();
        rerender(<Sparkline values={[5, 5]} area={false} />);
        expect(container.querySelectorAll('path')).toHaveLength(1);
    });
});
