import { Separator } from '@rinzai/zen';

/** Across between sections, and upright between items in a row. */
export default function Default() {
    return (
        <div className="flex w-full max-w-xs flex-col gap-3 text-sm">
            <div>
                <p className="mt-0! font-medium">September 2026</p>
                <p className="text-muted-foreground mt-0!">Budgets, entries and goals</p>
            </div>
            <Separator />
            <div className="text-muted-foreground flex h-5 items-center gap-3">
                <span>Spent $2,742</span>
                <Separator orientation="vertical" />
                <span>Left $1,258</span>
                <Separator orientation="vertical" />
                <span>12 entries</span>
            </div>
        </div>
    );
}
