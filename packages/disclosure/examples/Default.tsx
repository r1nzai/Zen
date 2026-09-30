import { Disclosure, DisclosureContent, DisclosureTrigger } from '@rinzai/zen';

const PAST = ['Laptop', 'Trip to Goa', 'Emergency fund'];

/** Finished goals tucked away under a toggle. */
export default function Default() {
    return (
        <div className="flex flex-col gap-3">
            <Disclosure>
                <DisclosureTrigger>Past ({PAST.length})</DisclosureTrigger>
                <DisclosureContent>
                    <ul className="text-muted-foreground flex flex-col gap-1 text-sm">
                        {PAST.map((g) => (
                            <li key={g}>{g}</li>
                        ))}
                    </ul>
                </DisclosureContent>
            </Disclosure>
        </div>
    );
}
