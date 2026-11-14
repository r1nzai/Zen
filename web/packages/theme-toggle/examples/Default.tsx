import { ThemeToggle } from '@rinzai/zen';

/** Flips the whole page between dark and light. Add <ThemeScript /> to <head> so the choice sticks on reload. */
export default function Default() {
    return (
        <div className="flex items-center gap-3 text-sm">
            <ThemeToggle />
            <span className="text-muted-foreground">Switch the theme</span>
        </div>
    );
}
