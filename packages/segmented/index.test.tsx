import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Segmented, { SegmentedItem } from './index';

const options = [
    { value: 'off', label: 'Off' },
    { value: 'soft', label: 'Soft' },
    { value: 'bright', label: 'Bright' },
] as const;

describe('Segmented', () => {
    it('is a labelled radio group with the value checked', () => {
        render(<Segmented label="Glow" value="soft" options={options} onChange={() => {}} />);
        expect(screen.getByRole('radiogroup', { name: 'Glow' })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: 'Soft' })).toBeChecked();
        expect(screen.getByRole('radio', { name: 'Off' })).not.toBeChecked();
    });

    it('reports the picked value', () => {
        const onChange = vi.fn();
        render(<Segmented label="Glow" value="soft" options={options} onChange={onChange} />);
        fireEvent.click(screen.getByRole('radio', { name: 'Bright' }));
        expect(onChange).toHaveBeenCalledWith('bright');
    });

    it('groups its radios under one name', () => {
        render(<Segmented label="Glow" name="glow" value="off" options={options} onChange={() => {}} />);
        for (const radio of screen.getAllByRole('radio')) expect(radio).toHaveAttribute('name', 'glow');
    });
    it('each radio is the click target for its option (an invisible layer over it)', () => {
        render(
            <Segmented
                label="Glow"
                value="soft"
                onChange={() => {}}
                options={[
                    { value: 'off', label: 'Off' },
                    { value: 'soft', label: 'Soft' },
                ]}
            />,
        );
        for (const radio of screen.getAllByRole('radio')) {
            expect(radio).toHaveClass('absolute', 'inset-0', 'size-full', 'opacity-0', 'z-10');
            expect(radio).not.toHaveClass('sr-only');
        }
    });

    describe('SegmentedItem', () => {
        it('takes any content, and is a radio named by it', () => {
            const onChange = vi.fn();
            render(
                <Segmented label="Pattern" value="contours" onChange={onChange}>
                    <SegmentedItem value="contours">
                        <svg data-testid="icon" /> Contours
                    </SegmentedItem>
                    <SegmentedItem value="dots">Dots</SegmentedItem>
                </Segmented>,
            );
            expect(screen.getByTestId('icon')).toBeInTheDocument();
            expect(screen.getByRole('radio', { name: 'Contours' })).toBeChecked();
            fireEvent.click(screen.getByRole('radio', { name: 'Dots' }));
            expect(onChange).toHaveBeenCalledWith('dots');
        });

        it('a disabled option cannot be chosen', async () => {
            const onChange = vi.fn();
            render(
                <Segmented label="Glow" value="soft" onChange={onChange}>
                    <SegmentedItem value="off">Off</SegmentedItem>
                    <SegmentedItem value="soft">Soft</SegmentedItem>
                    <SegmentedItem value="bright" disabled>
                        Bright
                    </SegmentedItem>
                </Segmented>,
            );
            const bright = screen.getByRole('radio', { name: 'Bright' });
            expect(bright).toBeDisabled();
            await userEvent.click(bright);
            expect(onChange).not.toHaveBeenCalled();
        });

        it('options and items share one radio group', () => {
            render(
                <Segmented label="Glow" value="off" onChange={() => {}} options={[{ value: 'off', label: 'Off' }]}>
                    <SegmentedItem value="soft">Soft</SegmentedItem>
                </Segmented>,
            );
            const [off, soft] = screen.getAllByRole('radio');
            expect(off).toHaveAttribute('name', soft.getAttribute('name'));
        });
    });
});
