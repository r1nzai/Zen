import { Header, Pill, PillIndicator, Pills, ThemeToggle } from '@rinzai/zen';

export default function Default() {
    return (
        <div className="w-full overflow-hidden rounded-xl">
            <Header className="static">
                <span className="text-lg font-semibold tracking-tight">Zen</span>
                <nav aria-label="Main">
                    <Pills>
                        <PillIndicator />
                        <Pill href="#docs" active>
                            Docs
                        </Pill>
                        <Pill href="#components">Components</Pill>
                    </Pills>
                </nav>
                <ThemeToggle />
            </Header>
        </div>
    );
}
