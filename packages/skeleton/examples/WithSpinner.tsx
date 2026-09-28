import { Spinner } from '@rinzai/zen';

export default function WithSpinner() {
    return (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Spinner /> Loading…
        </div>
    );
}
