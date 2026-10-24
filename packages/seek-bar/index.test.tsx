import { fireEvent, render, screen } from '@testing-library/react';

import SeekBar from './index';

describe('SeekBar', () => {
    it('shows the time played and the length, and names the slider', () => {
        render(<SeekBar currentTime={42} duration={187} onSeek={() => {}} />);
        const slider = screen.getByRole('slider', { name: 'Seek' });
        expect(slider).toHaveAttribute('aria-valuetext', '0:42 of 3:07');
        expect(screen.getByText('0:42')).toBeInTheDocument();
        expect(screen.getByText('3:07')).toBeInTheDocument();
    });

    it('follows the thumb while dragging, and seeks once let go', () => {
        const onSeek = vi.fn();
        render(<SeekBar currentTime={42} duration={187} onSeek={onSeek} />);
        const slider = screen.getByRole('slider');
        fireEvent.input(slider, { target: { value: '120' } });
        expect(screen.getByText('2:00')).toBeInTheDocument();
        expect(onSeek).not.toHaveBeenCalled();
        fireEvent.change(slider, { target: { value: '120' } });
        expect(onSeek).toHaveBeenCalledWith(120);
    });

    it('seeks 5 seconds with the arrow keys, and stays there until the player catches up', () => {
        const onSeek = vi.fn();
        const { rerender } = render(<SeekBar currentTime={42} duration={187} onSeek={onSeek} />);
        fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowRight' });
        expect(onSeek).toHaveBeenLastCalledWith(47);
        expect(screen.getByText('0:47')).toBeInTheDocument();
        fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowDown' });
        expect(onSeek).toHaveBeenLastCalledWith(42);
        rerender(<SeekBar currentTime={42.1} duration={187} onSeek={onSeek} />);
        expect(screen.getByText('0:42')).toBeInTheDocument();
    });

    it("doesn't snap to whole seconds", () => {
        render(<SeekBar currentTime={42.5} duration={187} onSeek={() => {}} />);
        expect(screen.getByRole('slider')).toHaveAttribute('step', 'any');
        expect(screen.getByRole('slider')).toHaveValue('42.5');
    });

    it('is disabled until the length is known', () => {
        render(<SeekBar currentTime={0} duration={0} onSeek={() => {}} />);
        expect(screen.getByRole('slider')).toBeDisabled();
    });
});
