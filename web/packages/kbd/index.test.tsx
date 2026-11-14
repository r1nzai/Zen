import { render, screen } from '@testing-library/react';

import Kbd from './index';

describe('Kbd', () => {
    it('is a <kbd>, taking a className', () => {
        render(<Kbd className="ml-1">K</Kbd>);
        const key = screen.getByText('K');
        expect(key.tagName).toBe('KBD');
        expect(key).toHaveClass('zen__kbd', 'ml-1');
    });
});
