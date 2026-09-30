import { Button, Card, CardHeader, CardTitle, Spinner } from '@rinzai/zen';
import { useState } from 'react';

/** Standing on its own, a spinner needs a label so screen readers announce what is loading. */
export default function Loading() {
    const [loading, setLoading] = useState(true);
    return (
        <Card className="w-80">
            <CardHeader>
                <CardTitle>Entries</CardTitle>
            </CardHeader>
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
