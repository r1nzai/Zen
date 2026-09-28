import { Badge, buttonVariants, Card, Stat, StatRow } from '@rinzai/zen';
import { Link } from 'react-router';

import { CodeCard } from '../components/code-block';
import { DocsLayout } from '../components/docs-layout';
import { COMPONENTS, componentPath } from '../pages';

export const meta = () => [
    { title: 'Zen · React components in dark glass' },
    {
        name: 'description',
        content:
            'React components in dark glass: translucent surfaces, hairline borders that catch a pointer light, and one accent colour. Built on native platform features.',
    },
];

const TOC = [
    { id: 'installation', label: 'Installation' },
    { id: 'usage', label: 'Usage' },
    { id: 'background', label: 'Background' },
    { id: 'theming', label: 'Theming' },
    { id: 'components', label: 'Components' },
];

export default function Home() {
    return (
        <DocsLayout toc={TOC}>
            <header className="mb-14 flex flex-col gap-5">
                <Badge className="self-start">v0.3 · dark glass</Badge>
                <h1 className="text-aurora text-5xl lg:text-6xl">Zen</h1>
                <p className="text-muted-foreground mt-0! max-w-2xl text-lg leading-relaxed">
                    React components in dark glass: translucent surfaces, hairline borders that catch a pointer light,
                    and one accent colour carrying the UI. Built on native platform features (<code>{'<dialog>'}</code>,
                    the Popover API, radio inputs) with a single runtime dependency.
                </p>
                <div className="flex flex-wrap gap-3">
                    <a href="#installation" className={buttonVariants()}>
                        Get started
                    </a>
                    <Link to="/showcase" className={buttonVariants({ variant: 'outline' })}>
                        See it in an app
                    </Link>
                </div>
            </header>

            <StatRow className="mb-16">
                <Stat label="Components" value={COMPONENTS.length} hint="and counting" />
                <Stat label="Runtime dependencies" value="1" hint="@tanstack/react-virtual" />
                <Stat label="Themes" value="Dark + light" tone="positive" hint="OKLCH tokens" />
            </StatRow>

            <div className="flex flex-col gap-14">
                <section className="flex flex-col gap-4">
                    <h2 id="installation">Installation</h2>
                    <CodeCard lang="shell" code="pnpm add @rinzai/zen" />
                    <p>Import the stylesheet once, near the root of your app. It includes the default theme.</p>
                    <CodeCard code={`import '@rinzai/zen/css';`} />
                    <p>
                        The look is set in{' '}
                        <a href="https://rsms.me/inter/" className="text-primary underline-offset-4 hover:underline">
                            Inter
                        </a>
                        . Load it however you like, for example with <code>@fontsource-variable/inter</code>.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 id="usage">Usage</h2>
                    <CodeCard
                        code={`
import { Backdrop, Button, Card } from '@rinzai/zen';

export default function App() {
    return (
        <>
            <Backdrop />
            <Card title="Budget">
                <Button>Save changes</Button>
            </Card>
        </>
    );
}`}
                    />
                </section>

                <section className="flex flex-col gap-4">
                    <h2 id="background">Background</h2>
                    <p>
                        <Link to={componentPath('backdrop')} className="text-primary underline-offset-4 hover:underline">
                            Backdrop
                        </Link>{' '}
                        draws the page background and lights up card edges near the pointer. It sits at{' '}
                        <code>z-index: -1</code>, so give <code>{'<html>'}</code> the background colour and keep{' '}
                        <code>{'<body>'}</code> transparent:
                    </p>
                    <CodeCard
                        lang="css"
                        code={`
html {
    background: oklch(var(--background));
}
body {
    background: transparent;
}`}
                    />
                </section>

                <section className="flex flex-col gap-4">
                    <h2 id="theming">Theming</h2>
                    <p>
                        Dark is the default. Add the <code>light</code> class (or <code>data-theme="light"</code>) to an
                        element for the light palette, and <code>dark</code> to switch back inside it. Try the switch in
                        the header.
                    </p>
                    <p>
                        Colours are OKLCH <code>L C H</code> triplets, used as <code>oklch(var(--primary))</code> or{' '}
                        <code>oklch(var(--primary) / 0.5)</code>. Lightness is fixed per role, so changing only the hue
                        keeps contrast intact. The defaults sit in a cascade layer, so your own values always win:
                    </p>
                    <CodeCard
                        lang="css"
                        code={`
:root {
    --primary: 0.72 0.13 200; /* teal instead of violet */
    --glow: 0.7 0.13 200;
    --glow-strength: 1; /* 0 turns every glow off */
}`}
                    />
                </section>

                <section className="flex flex-col gap-4">
                    <h2 id="components">Components</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {COMPONENTS.map((c) => (
                            <Link key={c.slug} to={componentPath(c.slug)} className="group rounded-xl outline-hidden focus-visible:ring-2 focus-visible:ring-glow/50">
                                <Card className="h-full transition-colors group-hover:bg-card/90">
                                    <p className="mt-0! font-semibold tracking-tight">{c.title}</p>
                                    <p className="text-muted-foreground mt-1! text-sm leading-6">{c.description}</p>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </DocsLayout>
    );
}
