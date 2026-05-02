import { fireEvent, render, screen } from '@testing-library/react';
import Toggle from './index';

describe('Toggle', () => {
    describe('rendering', () => {
        it('renders a clickable div', () => {
            const { container } = render(<Toggle />);
            expect(container.firstChild).toBeInTheDocument();
        });

        it('applies additional className to the root div', () => {
            const { container } = render(<Toggle className="my-custom-class" />);
            expect(container.firstChild).toHaveClass('my-custom-class');
        });
    });

    describe('knob position', () => {
        it('knob has translate-x-0.5 when unchecked', () => {
            const { container } = render(<Toggle checked={false} onChange={() => {}} />);
            const knob = container.querySelector('[class*="translate-x"]');
            expect(knob).toHaveClass('translate-x-0.5');
            expect(knob).not.toHaveClass('translate-x-5');
        });

        it('knob has translate-x-5 when checked', () => {
            const { container } = render(<Toggle checked={true} onChange={() => {}} />);
            const knob = container.querySelector('[class*="translate-x"]');
            expect(knob).toHaveClass('translate-x-5');
            expect(knob).not.toHaveClass('translate-x-0.5');
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

        it('does not throw when onChange is not provided', () => {
            const { container } = render(<Toggle checked={false} />);
            expect(() => fireEvent.click(container.firstChild as Element)).not.toThrow();
        });
    });
});
