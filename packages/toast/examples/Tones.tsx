import { Button, useToast } from '@rinzai/zen';

/** Needs a <ToastProvider> above it, once near the root of your app. */
export default function Tones() {
    const toast = useToast();
    return (
        <div className="flex flex-wrap gap-3">
            <Button onClick={() => toast('Saved', { description: 'Your changes are stored.', tone: 'success' })}>
                Success
            </Button>
            <Button
                variant="outline"
                onClick={() => toast('Entry deleted', { action: { label: 'Undo', onClick: () => {} } })}
            >
                With action
            </Button>
            <Button
                variant="destructive"
                onClick={() => toast("Couldn't save", { description: 'Check your connection.', tone: 'error' })}
            >
                Error
            </Button>
        </div>
    );
}
