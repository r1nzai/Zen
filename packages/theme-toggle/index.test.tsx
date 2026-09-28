import { fireEvent, render, screen } from '@testing-library/react';

import ThemeToggle, { themeScript } from './index';

describe('ThemeToggle', () => {
    beforeEach(() => {
        document.documentElement.className = 'dark';
        localStorage.clear();
    });

    it('switches <html> between dark and light and remembers it', () => {
        render(<ThemeToggle />);
        fireEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));
        expect(document.documentElement).toHaveClass('light');
        expect(document.documentElement).not.toHaveClass('dark');
        expect(localStorage.getItem('theme')).toBe('light');
        fireEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
        expect(document.documentElement).toHaveClass('dark');
        expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('starts from the theme already on <html>', () => {
        document.documentElement.className = 'light';
        render(<ThemeToggle />);
        expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument();
    });

    it('ThemeScript applies the remembered theme', () => {
        localStorage.setItem('zen-theme', 'light');
        new Function(themeScript('zen-theme'))();
        expect(document.documentElement).toHaveClass('light');
        expect(document.documentElement).not.toHaveClass('dark');
    });
});
