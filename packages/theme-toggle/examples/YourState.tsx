import { ThemeToggle, type Appearance } from '@rinzai/zen';
import { useRef, useState } from 'react';

/**
 * The theme kept by your app (state here; an account setting, a cookie or a database in yours):
 * the toggle shows `value`, and `onChange` applies the new one. This one themes just its panel,
 * so `target` keeps the water inside it.
 */
export default function YourState() {
    const [theme, setTheme] = useState<Appearance>('light');
    const panel = useRef<HTMLDivElement>(null);
    return (
        <div
            ref={panel}
            className={`${theme} bg-background text-foreground flex h-96 w-full flex-col justify-between rounded-2xl border p-6 text-sm`}
        >
            <div className="flex items-center justify-between">
                <span className="font-medium">Preview</span>
                <ThemeToggle value={theme} onChange={setTheme} target={panel} />
            </div>
            <span className="text-muted-foreground">This panel is {theme}; the page around it stays as it is.</span>
        </div>
    );
}
