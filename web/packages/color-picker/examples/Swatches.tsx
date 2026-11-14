import { ColorPicker, Field } from '@rinzai/zen';
import { useState } from 'react';

const SWATCHES = [
    { label: 'Violet', value: '#7c5cff' },
    { label: 'Teal', value: '#2bb3a3' },
    { label: 'Amber', value: '#f0a83a' },
    { label: 'Rose', value: '#ef5a7a' },
    { label: 'White', value: '#ffffff' },
    { label: 'Black', value: '#000000' },
];

/** With `alpha`, an opacity slider, and values like "#7c5cff99". Swatches are yours, such as your brand's colours. */
export default function Swatches() {
    const [color, setColor] = useState('#2bb3a3cc');
    return (
        <Field label="Card background" className="w-64">
            <ColorPicker value={color} onValueChange={setColor} alpha swatches={SWATCHES} />
        </Field>
    );
}
