import { Alert } from '@rinzai/zen';

/** A tinted box per tone; a `title` leads, and the text under it is quieter. */
export default function Default() {
    return (
        <div className="flex w-full max-w-md flex-col gap-3">
            <Alert>Changes to this item apply from next month.</Alert>
            <Alert tone="positive">Your data is up to date on every device.</Alert>
            <Alert tone="negative" title="Your data will be deleted for good.">
                Without your password or recovery key, nobody can open it. Starting over gives you a new, empty vault.
            </Alert>
        </div>
    );
}
