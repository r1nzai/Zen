import { Button } from '@rinzai/zen';
import { useState } from 'react';

export default function Loading() {
    const [saving, setSaving] = useState(false);
    return (
        <Button
            loading={saving}
            onClick={() => {
                setSaving(true);
                setTimeout(() => setSaving(false), 1500);
            }}
        >
            {saving ? 'Saving…' : 'Save'}
        </Button>
    );
}
