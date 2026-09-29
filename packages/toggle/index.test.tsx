import { fireEvent, render, screen } from '@testing-library/react';
import Toggle from './index';

describe('Toggle', () => {
    describe('rendering', () => {
        it('renders a clickable label', () => {
            const { container } = render(<Toggle />);
            expect(container.firstChild).toBeInTheDocument();
        });

        it('applies additional className to the root label', () => {
            const { container } = render(<Toggle className="my-custom-class" />);
            expect(container.firstChild).toHaveClass('my-custom-class');
        });
    });

    describe('switch state', () => {
        it('is announced as an unchecked switch', () => {
            render(<Toggle checked={false} onChange={() => {}} />);
            expect(screen.getByRole('switch')).not.toBeChecked();
        });

        it('is announced as a checked switch', () => {
            render(<Toggle checked={true} onChange={() => {}} />);
            expect(screen.getByRole('switch')).toBeChecked();
        });

        it('slides the knob with the checked state', () => {
            const { container } = render(<Toggle />);
            expect(container.querySelector('span')).toHaveClass('peer-checked:translate-x-5');
        });
    });

    describe('onChange behaviour', () => {
        it('calls onChange(true) when clicked while unchecked', () => {
            const onChange = vi.fn();
            const { container } = render(<Toggle checked={false} onChange={onChange} />);
            fireEvent.click(container.firstChild as Element);
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledWith(true);
        });

        it('calls onChange(false) when clicked while checked', () => {
            const onChange = vi.fn();
            const { container } = render(<Toggle checked={true} onChange={onChange} />);
            fireEvent.click(container.firstChild as Element);
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledWith(false);
        });

        it('Enter flips it too, without submitting a surrounding form', () => {
            const onChange = vi.fn();
            const onSubmit = vi.fn((e: Event) => e.preventDefault());
            render(
                <form onSubmit={onSubmit as never}>
                    <Toggle aria-label="Placeholder" onChange={onChange} />
                </form>,
            );
            fireEvent.keyDown(screen.getByRole('switch'), { key: 'Enter' });
            expect(onChange).toHaveBeenCalledWith(true);
            expect(onSubmit).not.toHaveBeenCalled();
        });

        it('does not throw when onChange is not provided', () => {
            const { container } = render(<Toggle checked={false} />);
            expect(() => fireEvent.click(container.firstChild as Element)).not.toThrow();
        });
    });
    it('the switch itself is the click target (an invisible layer over the whole control)', () => {
        render(<Toggle aria-label="Placeholder" />);
        const input = screen.getByRole('switch');
        expect(input).toHaveClass('absolute', 'inset-0', 'size-full', 'opacity-0', 'z-10');
        expect(input).not.toHaveClass('sr-only');
    });
});
