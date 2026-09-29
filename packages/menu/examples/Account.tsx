import { Avatar, Menu, MenuHeader, MenuItem, MenuSeparator, useToast } from '@rinzai/zen';

const icon = (d: string) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-4"
    >
        <path d={d} />
    </svg>
);
const SETTINGS = icon(
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 13a7.4 7.4 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.7-1L15 3.5h-4l-.4 2.5a7 7 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.4 2.5h4l.4-2.5a7 7 0 0 0 1.7-1l2.4 1 2-3.4Z',
);
const LOCK = icon('M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z');
const LOG_OUT = icon('M15 12H3m0 0 4-4m-4 4 4 4M9 4h9a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H9');

/** Your own trigger (an avatar), a header that isn't a choice, icons, groups, and a destructive item. */
export default function Account() {
    const toast = useToast();
    const email = 'rin@example.com';
    return (
        <Menu
            label="Account menu"
            offset={10}
            trigger={<Avatar name={email} />}
            triggerClassName="focus-visible:ring-ring/50 data-popup-open:ring-ring/40 rounded-full outline-hidden transition-transform duration-200 hover:scale-105 focus-visible:ring-2 data-popup-open:ring-2"
            className="w-64 shadow-[0_20px_60px_-20px_oklch(0_0_0/0.8)]"
        >
            <MenuHeader>
                <Avatar name={email} className="size-10" />
                <div className="min-w-0">
                    <div className="text-muted-foreground text-xs">Signed in as</div>
                    <div className="truncate text-sm font-medium" title={email}>
                        {email}
                    </div>
                </div>
            </MenuHeader>
            <MenuSeparator />
            <MenuItem icon={SETTINGS} onSelect={() => toast('Settings')}>
                Settings
            </MenuItem>
            <MenuItem icon={LOCK} onSelect={() => toast('Locked', { tone: 'success' })}>
                Lock now
            </MenuItem>
            <MenuSeparator />
            <MenuItem destructive icon={LOG_OUT} onSelect={() => toast('Logged out')}>
                Log out
            </MenuItem>
        </Menu>
    );
}
