import { ColorPicker, Field } from '@rinzai/zen';
import { useState } from 'react';

export default function Default() {
    const [color, setColor] = useState('#7c5cff');
    return (
        <Field label="Title colour" className="w-64">
            <ColorPicker value={color} onValueChange={setColor} />
        </Field>
    );
}
