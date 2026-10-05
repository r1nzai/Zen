import { Button, Card, EmptyState } from '@rinzai/zen';
import ListBullet from '@zen/icons/list-bullet';

/** A month with no entries yet: what's missing, and the action that adds the first one. */
export default function Default() {
    return (
        <Card className="w-full max-w-md">
            <EmptyState
                icon={<ListBullet />}
                title="No entries this month"
                description="Add your income and spending, or bring them in from a bank statement."
            >
                <Button>Add entry</Button>
                <Button variant="outline">Import</Button>
            </EmptyState>
        </Card>
    );
}
