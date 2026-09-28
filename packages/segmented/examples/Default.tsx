import { Segmented } from '@rinzai/zen';
import { useState } from 'react';

export default function Default() {
    const [glow, setGlow] = useState<'off' | 'soft' | 'bright'>('soft');
    return (
        <Segmented
            label="Glow"
            value={glow}
            onChange={setGlow}
            options={[
                { value: 'off', label: 'Off' },
                { value: 'soft', label: 'Soft' },
                { value: 'bright', label: 'Bright' },
            ]}
        />
    );
}
