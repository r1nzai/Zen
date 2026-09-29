import { Avatar, Button, cx } from '@rinzai/zen';

/**
 * className always wins: when it sets something a component already sets
 * (size, padding, radius, colour…), the component's default is dropped. Your
 * own components get the same with cx.
 */
export default function Overrides() {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
                <Button>Default</Button>
                <Button className="h-12 rounded-full px-8">Taller, rounder</Button>
                <Avatar name="Sam" />
                <Avatar name="Sam" className="size-14 text-xl" />
            </div>
            <code className="text-muted-foreground text-xs">
                cx(&apos;px-3 py-1 rounded-lg&apos;, &apos;p-4 rounded-full&apos;) →{' '}
                {cx('px-3 py-1 rounded-lg', 'p-4 rounded-full')}
            </code>
        </div>
    );
}
