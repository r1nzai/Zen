import { render, screen } from '@testing-library/react';

import Header from '../header';
import PageHeader from './index';

describe('PageHeader', () => {
    it('shows eyebrow, an aurora title and the lead', () => {
        render(<PageHeader eyebrow="Components" title="Button" lead="Actions." />);
        expect(screen.getByRole('heading', { level: 1, name: 'Button' })).toHaveClass('text-aurora');
        expect(screen.getByText('Components')).toBeInTheDocument();
        expect(screen.getByText('Actions.')).toBeInTheDocument();
    });
});

describe('Header', () => {
    it('is a sticky, blurred banner', () => {
        render(<Header>Zen</Header>);
        expect(screen.getByRole('banner')).toHaveClass('sticky', 'backdrop-blur-xl', 'border-b');
        expect(screen.getByRole('banner')).toHaveTextContent('Zen');
    });
});
