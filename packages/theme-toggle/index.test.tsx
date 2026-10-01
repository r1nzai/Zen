import { act, fireEvent, render, screen } from '@testing-library/react';
import { useEffect, useRef, useState } from 'react';

import type { Appearance } from '@zen/utils/theme';
import ThemeToggle, { themeScript } from './index';

// What the page was when the wave captured it: right after its change returned.
const captured: string[] = [];
const targets: unknown[] = [];
vi.mock('@zen/utils/theme-wave', () => ({
    prepareThemeWave: () => {},
    themeWave: (change: () => void, _from: unknown, target: unknown) => {
        targets.push(target);
        change();
        captured.push(document.documentElement.dataset.mode ?? document.documentElement.className);
    },
}));

describe('ThemeToggle', () => {
    beforeEach(() => {
        document.documentElement.className = 'dark';
        delete document.documentElement.dataset.mode;
        localStorage.clear();
        captured.length = 0;
        targets.length = 0;
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

    it('keeps every toggle on the page in step', () => {
        render(
            <>
                <ThemeToggle />
                <ThemeToggle />
            </>,
        );
        fireEvent.click(screen.getAllByRole('button', { name: 'Switch to light theme' })[0]);
        expect(screen.getAllByRole('button', { name: 'Switch to dark theme' })).toHaveLength(2);
    });

    it('follows the theme when something else changes it', async () => {
        render(<ThemeToggle />);
        await act(async () => {
            document.documentElement.className = 'light';
        });
        expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument();
    });

    it('with value, shows it and leaves the theme to onChange', () => {
        const onChange = vi.fn();
        const { rerender } = render(<ThemeToggle value="light" onChange={onChange} />);
        fireEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
        expect(onChange).toHaveBeenCalledWith('dark');
        expect(document.documentElement).toHaveClass('dark');
        expect(localStorage.getItem('theme')).toBeNull();
        // Not switched until the value is.
        expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument();
        rerender(<ThemeToggle value="dark" onChange={onChange} />);
        expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument();
    });

    it('with value, the wave sees the theme an app applies from its state, in an effect', () => {
        function App() {
            const [mode, setMode] = useState<Appearance>('dark');
            useEffect(() => {
                document.documentElement.dataset.mode = mode;
            }, [mode]);
            return <ThemeToggle value={mode} onChange={setMode} />;
        }
        render(<App />);
        fireEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));
        expect(captured).toEqual(['light']);
    });

    it('with target, the wave plays in that element', () => {
        function Panel() {
            const [mode, setMode] = useState<Appearance>('dark');
            const panel = useRef<HTMLDivElement>(null);
            return (
                <div ref={panel} data-testid="panel" className={mode}>
                    <ThemeToggle value={mode} onChange={setMode} target={panel} />
                </div>
            );
        }
        render(<Panel />);
        fireEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));
        expect(targets).toEqual([screen.getByTestId('panel')]);
        expect(screen.getByTestId('panel')).toHaveClass('light');
    });

    it('without value, onChange is told too', () => {
        const onChange = vi.fn();
        render(<ThemeToggle onChange={onChange} />);
        fireEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));
        expect(onChange).toHaveBeenCalledWith('light');
        expect(captured).toEqual(['light']);
    });

    it('ThemeScript applies the remembered theme', () => {
        localStorage.setItem('zen-theme', 'light');
        new Function(themeScript('zen-theme'))();
        expect(document.documentElement).toHaveClass('light');
        expect(document.documentElement).not.toHaveClass('dark');
    });
});
