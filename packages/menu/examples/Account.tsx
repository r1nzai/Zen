import { Avatar, Menu, MenuContent, MenuHeader, MenuItem, MenuSeparator, MenuTrigger, useToast } from '@rinzai/zen';
import Lock from '@zen/icons/lock';
import Logout from '@zen/icons/logout';
import Settings from '@zen/icons/settings';

/** Your own trigger (an avatar), a header that isn't a choice, icons, groups, and a destructive item. */
export default function Account() {
    const toast = useToast();
    const email = 'rin@example.com';
    return (
        <Menu>
            <MenuTrigger
                aria-label="Account menu"
                className="focus-visible:ring-ring/50 data-popup-open:ring-ring/40 rounded-full outline-hidden transition-transform duration-200 hover:scale-105 focus-visible:ring-2 data-popup-open:ring-2"
            >
                <Avatar name={email} />
            </MenuTrigger>
            <MenuContent offset={10} className="w-64 shadow-[0_20px_60px_-20px_oklch(0_0_0/0.8)]">
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
                <MenuItem icon={<Settings className="size-4" />} onSelect={() => toast('Settings')}>
                    Settings
                </MenuItem>
                <MenuItem icon={<Lock className="size-4" />} onSelect={() => toast('Locked', { tone: 'success' })}>
                    Lock now
                </MenuItem>
                <MenuSeparator />
                <MenuItem destructive icon={<Logout className="size-4" />} onSelect={() => toast('Logged out')}>
                    Log out
                </MenuItem>
            </MenuContent>
        </Menu>
    );
}
