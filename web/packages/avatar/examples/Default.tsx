import { Avatar } from '@rinzai/zen';

const PHOTO =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#2f2943"/><circle cx="32" cy="26" r="12" fill="#ab93ed"/><rect x="12" y="42" width="40" height="30" rx="15" fill="#ab93ed"/></svg>',
    );

/** An image, or the name's initial on the accent. Size it with className. */
export default function Default() {
    return (
        <div className="flex items-center gap-4">
            <Avatar name="rin@example.com" />
            <Avatar name="Sam" className="size-12 text-lg" />
            <Avatar name="Alex" src={PHOTO} alt="Alex" className="size-12" />
            <div className="flex items-center gap-2 text-sm">
                <Avatar name="Priya" className="size-7 text-xs" />
                Priya
            </div>
        </div>
    );
}
