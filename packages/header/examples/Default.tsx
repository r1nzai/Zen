import { Header, NavPill, NavPillIndicator, NavPills, ThemeToggle } from '@rinzai/zen';

export default function Default() {
    return (
        <div className="w-full overflow-hidden rounded-xl">
            <Header className="static">
                <span className="text-lg font-semibold tracking-tight">Zen</span>
                <NavPills aria-label="Main">
                    <NavPillIndicator />
                    <NavPill href="#docs" active>
                        Docs
                    </NavPill>
                    <NavPill href="#components">Components</NavPill>
                </NavPills>
                <ThemeToggle />
            </Header>
        </div>
    );
}
