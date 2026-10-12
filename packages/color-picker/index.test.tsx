import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';

import Field from '../field';
import ColorPicker, { ColorPanel, type ColorPanelProps } from './index';

function Panel({
    onValueChange = () => {},
    initial = '#ff0000',
    ...rest
}: Partial<ColorPanelProps> & { initial?: string }) {
    const [value, setValue] = useState(initial);
    return (
        <>
            <ColorPanel
                value={value}
                onValueChange={(v) => {
                    setValue(v);
                    onValueChange(v);
                }}
                {...rest}
            />
            <output>{value}</output>
        </>
    );
}

const area = () => screen.getByRole('slider', { name: 'Saturation and brightness' });
const shown = () => screen.getByRole('status').textContent;

describe('ColorPanel', () => {
    it('moves saturation and brightness with the arrow keys, Shift by 10', () => {
        const commit = vi.fn();
        render(<Panel onValueCommit={commit} />);
        expect(area()).toHaveAttribute('aria-valuetext', 'Saturation 100%, brightness 100%');
        fireEvent.keyDown(area(), { key: 'ArrowLeft', shiftKey: true });
        fireEvent.keyDown(area(), { key: 'ArrowDown' });
        expect(area()).toHaveAttribute('aria-valuetext', 'Saturation 90%, brightness 99%');
        expect(shown()).toBe('#fc1919');
        expect(commit).toHaveBeenLastCalledWith('#fc1919');
    });

    it('keeps the hue through black', () => {
        render(<Panel initial="#0000ff" />);
        for (let i = 0; i < 10; i++) fireEvent.keyDown(area(), { key: 'ArrowDown', shiftKey: true });
        expect(shown()).toBe('#000000');
        fireEvent.keyDown(area(), { key: 'ArrowUp', shiftKey: true });
        expect(shown()).toBe('#00001a');
        expect(screen.getByRole('slider', { name: 'Hue' })).toHaveValue('240');
    });

    it('takes a typed hex on Enter, and puts back one that is not a colour', () => {
        render(<Panel />);
        const hex = screen.getByRole('textbox', { name: 'Hex' });
        fireEvent.change(hex, { target: { value: '0f0' } });
        fireEvent.keyDown(hex, { key: 'Enter' });
        expect(shown()).toBe('#00ff00');
        fireEvent.change(hex, { target: { value: 'green' } });
        fireEvent.blur(hex);
        expect(hex).toHaveValue('#00ff00');
    });

    it('offers opacity only with alpha', () => {
        const { unmount } = render(<Panel />);
        expect(screen.queryByRole('slider', { name: 'Opacity' })).toBeNull();
        unmount();
        render(<Panel alpha />);
        fireEvent.change(screen.getByRole('slider', { name: 'Opacity' }), { target: { value: '50' } });
        expect(shown()).toBe('#ff000080');
    });

    it('drops alpha from values without the alpha option', () => {
        render(<Panel />);
        const hex = screen.getByRole('textbox', { name: 'Hex' });
        fireEvent.change(hex, { target: { value: '#00ff0080' } });
        fireEvent.keyDown(hex, { key: 'Enter' });
        expect(shown()).toBe('#00ff00');
    });

    it('picks a swatch, and marks the one that is the value', () => {
        render(
            <Panel
                swatches={[
                    { label: 'Accent', value: '#7C5CFF' },
                    { label: 'White', value: '#fff' },
                ]}
            />,
        );
        fireEvent.click(screen.getByRole('radio', { name: 'Accent' }));
        expect(shown()).toBe('#7c5cff');
        expect(screen.getByRole('radio', { name: 'Accent' })).toBeChecked();
        expect(screen.getByRole('radio', { name: 'White' })).not.toBeChecked();
    });
});

describe('ColorPicker', () => {
    it('shows the value, and is labelled and described by its Field', () => {
        render(
            <Field label="Text colour" hint="Used for titles">
                <ColorPicker value="#7c5cff" onValueChange={() => {}} />
            </Field>,
        );
        const trigger = screen.getByRole('button', { name: /Text colour/ });
        expect(trigger).toHaveTextContent('#7c5cff');
        expect(trigger).toHaveAccessibleDescription('Used for titles');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('changes the value from its panel', () => {
        const onChange = vi.fn();
        render(<ColorPicker aria-label="Colour" value="#ff0000" onValueChange={onChange} />);
        fireEvent.keyDown(screen.getByRole('slider', { name: 'Saturation and brightness', hidden: true }), {
            key: 'ArrowLeft',
        });
        expect(onChange).toHaveBeenCalledWith('#ff0303');
    });
});
