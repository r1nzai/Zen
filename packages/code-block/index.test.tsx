import { act, fireEvent, render, screen } from '@testing-library/react';

import CodeBlock from './index';

describe('CodeBlock', () => {
    it('shows trimmed code as plain text without a highlighter', () => {
        const { container } = render(<CodeBlock code={'\n  const a = 1;\n'} />);
        expect(container.querySelector('code')?.textContent).toBe('const a = 1;');
    });

    it('renders highlighted HTML from `highlight`', () => {
        const highlight = vi.fn((code: string) => `<span class="kw">${code}</span>`);
        const { container } = render(<CodeBlock code="let" language="ts" highlight={highlight} />);
        expect(highlight).toHaveBeenCalledWith('let', 'ts');
        expect(container.querySelector('.kw')).toHaveTextContent('let');
        expect(container.firstChild).toHaveAttribute('data-language', 'ts');
    });

    it('copies the code and confirms', async () => {
        vi.useFakeTimers();
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.assign(navigator, { clipboard: { writeText } });
        render(<CodeBlock code="pnpm add @rinzai/zen" />);
        await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy' })));
        expect(writeText).toHaveBeenCalledWith('pnpm add @rinzai/zen');
        expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
        act(() => vi.advanceTimersByTime(1500));
        expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
        vi.useRealTimers();
    });

    it('can hide the copy button', () => {
        render(<CodeBlock code="x" copyable={false} />);
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('draws its own lit glass panel by default', () => {
        const { container } = render(<CodeBlock code="x" />);
        expect(container.firstChild).toHaveClass('glass', 'glow-edge', 'rounded-xl');
    });

    it('has no surface with variant="plain", for code inside a card', () => {
        const { container } = render(<CodeBlock code="x" variant="plain" />);
        expect(container.firstChild).not.toHaveClass('glass');
        expect(container.firstChild).not.toHaveClass('glow-edge');
    });
});
