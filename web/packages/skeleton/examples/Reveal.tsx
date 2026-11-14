import { Button, Skeleton } from '@rinzai/zen';
import { useState } from 'react';

export default function Reveal() {
    const [loading, setLoading] = useState(true);
    return (
        <div className="flex flex-col items-start gap-4">
            <div className="glass glow-edge flex w-80 flex-col gap-3 rounded-xl p-4">
                <Skeleton loading={loading} className="h-3 w-24">
                    <p className="text-muted-foreground text-xs">Balance</p>
                </Skeleton>
                <Skeleton loading={loading} className="h-7 w-40">
                    <p className="text-2xl font-semibold tabular-nums">$4,280.15</p>
                </Skeleton>
            </div>
            <Button variant="outline" onClick={() => setLoading((l) => !l)}>
                {loading ? 'Load' : 'Reload'}
            </Button>
        </div>
    );
}
