import { Button, Card, Spinner } from '@rinzai/zen';
import { useState } from 'react';

/** Standing on its own, a spinner needs a label so screen readers announce what is loading. */
export default function Loading() {
    const [loading, setLoading] = useState(true);
    return (
        <Card title="Entries" className="w-80">
            {loading ? (
                <div className="text-muted-foreground flex items-center gap-3 py-6 text-sm">
                    <Spinner label="Loading entries" />
                    Loading entries…
                </div>
            ) : (
                <p className="py-6 text-sm">12 entries this month.</p>
            )}
            <Button variant="outline" size="sm" onClick={() => setLoading((l) => !l)}>
                {loading ? 'Finish loading' : 'Load again'}
            </Button>
        </Card>
    );
}
