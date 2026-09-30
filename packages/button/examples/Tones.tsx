import { Button } from '@rinzai/zen';
import XMark from '@zen/icons/x-mark';

/** A link sits in the text and truncates; `tone` quiets it or makes it red. An icon button with a destructive tone turns red only when pointed at. */
export default function Tones() {
    return (
        <div className="flex flex-col gap-3 text-sm">
            <p>
                Saved. <Button variant="link">Undo</Button> or{' '}
                <Button variant="link" tone="muted">
                    see history
                </Button>
            </p>
            <div className="flex items-center gap-3">
                <Button variant="link" tone="destructive">
                    Delete account
                </Button>
                <Button variant="ghost" size="icon" tone="destructive" aria-label="Remove">
                    <XMark className="size-4" />
                </Button>
            </div>
        </div>
    );
}
