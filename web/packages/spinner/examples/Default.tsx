import { Spinner } from '@rinzai/zen';

/** Sized and coloured with className; it follows the text colour. */
export default function Default() {
    return (
        <div className="flex items-center gap-6">
            <Spinner />
            <Spinner className="size-6" />
            <Spinner className="text-primary size-8 border-[3px]" />
            <Spinner className="text-muted-foreground size-5" />
        </div>
    );
}
