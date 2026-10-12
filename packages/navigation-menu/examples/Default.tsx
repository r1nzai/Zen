import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuTrigger,
} from '@rinzai/zen';

/**
 * A site's top navigation: rest the pointer on Plan or Reports (or click, or
 * Tab to one and press Enter) for its panel; once one is open, moving to the
 * other switches at once.
 */
export default function Default() {
    return (
        <NavigationMenu aria-label="Site">
            <NavigationMenuItem>
                <NavigationMenuLink href="#overview" active>
                    Overview
                </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
                <NavigationMenuTrigger>Plan</NavigationMenuTrigger>
                <NavigationMenuContent className="grid w-[26rem] grid-cols-2 gap-1">
                    <NavigationMenuLink href="#budgets" description="Limits for each category, month by month.">
                        Budgets
                    </NavigationMenuLink>
                    <NavigationMenuLink href="#goals" description="Savings with a target and a date.">
                        Goals
                    </NavigationMenuLink>
                    <NavigationMenuLink href="#bills" description="What's due, and when it repeats.">
                        Bills
                    </NavigationMenuLink>
                    <NavigationMenuLink href="#planner" description="The year ahead, item by item.">
                        Planner
                    </NavigationMenuLink>
                </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
                <NavigationMenuTrigger>Reports</NavigationMenuTrigger>
                <NavigationMenuContent className="flex w-60 flex-col">
                    <NavigationMenuLink href="#spending">Spending</NavigationMenuLink>
                    <NavigationMenuLink href="#income">Income</NavigationMenuLink>
                    <NavigationMenuLink href="#net-worth">Net worth</NavigationMenuLink>
                </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
                <NavigationMenuLink href="#help">Help</NavigationMenuLink>
            </NavigationMenuItem>
        </NavigationMenu>
    );
}
