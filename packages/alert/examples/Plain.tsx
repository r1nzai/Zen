import { Alert, Card, CardHeader, CardTitle, Spinner } from '@rinzai/zen';

/** `plain`: just the icon and text, for a line inside a card or a form. Any icon, or none. */
export default function Plain() {
    return (
        <Card className="flex w-full max-w-sm flex-col gap-3">
            <CardHeader className="mb-0">
                <CardTitle>Currency</CardTitle>
            </CardHeader>
            <Alert plain icon={<Spinner className="text-primary" />}>
                Getting today’s rate…
            </Alert>
            <Alert plain tone="negative">
                Couldn’t get today’s rate, so converting isn’t possible right now.
            </Alert>
        </Card>
    );
}
