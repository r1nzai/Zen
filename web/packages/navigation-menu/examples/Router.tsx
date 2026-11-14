import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuTrigger,
} from '@rinzai/zen';
import { useState } from 'react';

const ACCOUNTS = ['Everyday', 'Savings', 'Credit card'];

/**
 * With your router: `asChild` puts each link's look and wiring on your own
 * Link (a button stands in for one here), and `active` follows the page.
 */
export default function Router() {
    const [page, setPage] = useState('Everyday');
    return (
        <div className="flex flex-col items-center gap-4">
            <NavigationMenu aria-label="Accounts">
                <NavigationMenuItem>
                    <NavigationMenuTrigger>Accounts</NavigationMenuTrigger>
                    <NavigationMenuContent className="flex w-48 flex-col">
                        {ACCOUNTS.map((name) => (
                            <NavigationMenuLink key={name} asChild active={page === name}>
                                <button type="button" className="text-start" onClick={() => setPage(name)}>
                                    {name}
                                </button>
                            </NavigationMenuLink>
                        ))}
                    </NavigationMenuContent>
                </NavigationMenuItem>
            </NavigationMenu>
            <p className="text-muted-foreground mt-0! text-sm">Showing {page}</p>
        </div>
    );
}
