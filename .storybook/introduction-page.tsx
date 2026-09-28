import { Unstyled } from '@storybook/addon-docs/blocks';
import { navigate } from '@storybook/addon-links';
import type { ReactNode } from 'react';
import { highlight } from 'sugar-high';

import { COMPONENTS } from '../docs/app/pages';
import Badge from '../packages/badge';
import { buttonVariants } from '../packages/button';
import Card, { Stat, StatRow } from '../packages/card';
import CodeBlock from '../packages/code-block';

/** Storybook's docs id for a component page: "Components/NavPills" → "components-navpills--docs". */
const docsId = (slug: string) => `components-${slug.replace(/-/g, '')}--docs`;

/** Introduction page, built from Zen's own components (mounted by packages/introduction.mdx). */
export function IntroductionPage() {
    return (
        <Unstyled>
            <article className="flex flex-col gap-14 font-sans">
                <header className="flex flex-col gap-5">
                    <Badge className="self-start">v0.3 · dark glass</Badge>
                    <h1 className="text-aurora text-5xl font-semibold tracking-tight lg:text-6xl">Zen</h1>
                    <p className="text-muted-foreground mt-0! max-w-2xl text-lg leading-relaxed">
                        React components in dark glass: translucent surfaces, hairline borders that catch a pointer
                        light, and one accent colour carrying the UI. Built on native platform features (
                        <code>{'<dialog>'}</code>, the Popover API, radio inputs) with a single runtime dependency.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <button className={buttonVariants()} onClick={() => navigate({ storyId: docsId('button') })}>
                            Browse components
                        </button>
                        <button
                            className={buttonVariants({ variant: 'outline' })}
                            onClick={() => navigate({ storyId: 'showcase--budget' })}
                        >
                            See it in an app
                        </button>
                        <a href="https://zen.rinzai.dev" target="_top" className={buttonVariants({ variant: 'ghost' })}>
                            zen.rinzai.dev ↗
                        </a>
                    </div>
                </header>

                <StatRow>
                    <Stat label="Components" value={COMPONENTS.length} hint="and counting" />
                    <Stat label="Runtime dependencies" value="1" hint="@tanstack/react-virtual" />
                    <Stat label="Themes" value="Dark + light" tone="positive" hint="OKLCH tokens" />
                </StatRow>

                <Section id="installation" title="Installation">
                    <Code language="shell" code="pnpm add @rinzai/zen" />
                    <p>Import the stylesheet once, near the root of your app. It includes the default theme.</p>
                    <Code code={`import '@rinzai/zen/css';`} />
                    <p>
                        The look is set in <strong>Inter</strong>. Load it however you like, for example with{' '}
                        <code>@fontsource-variable/inter</code>.
                    </p>
                </Section>

                <Section id="usage" title="Usage">
                    <Code
                        code={`import { Backdrop, Button, Card } from '@rinzai/zen';

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
                </Section>

                <Section id="background" title="Background">
                    <p>
                        <code>{'<Backdrop>'}</code> draws the page background and lights up card edges near the pointer.
                        It sits at <code>z-index: -1</code>, so give <code>{'<html>'}</code> the background colour and
                        keep <code>{'<body>'}</code> transparent:
                    </p>
                    <Code
                        language="css"
                        code={`html {
    background: oklch(var(--background));
}
body {
    background: transparent;
}`}
                    />
                </Section>

                <Section id="theming" title="Theming">
                    <p>
                        Dark is the default. Add the <code>light</code> class (or <code>data-theme="light"</code>) to an
                        element for the light palette, and <code>dark</code> to switch back inside it. Try the theme
                        switch in the toolbar.
                    </p>
                    <p>
                        Colours are OKLCH <code>L C H</code> triplets, used as <code>oklch(var(--primary))</code> or{' '}
                        <code>oklch(var(--primary) / 0.5)</code>. Lightness is fixed per role, so changing only the hue
                        keeps contrast intact. The defaults sit in a cascade layer, so your own values always win:
                    </p>
                    <Code
                        language="css"
                        code={`:root {
    --primary: 0.72 0.13 200; /* teal instead of violet */
    --glow: 0.7 0.13 200;
    --glow-strength: 1; /* 0 turns every glow off */
}`}
                    />
                </Section>

                <Section id="components" title="Components">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {COMPONENTS.map((c) => (
                            <button
                                key={c.slug}
                                onClick={() => navigate({ storyId: docsId(c.slug) })}
                                className="group focus-visible:ring-glow/50 rounded-xl text-left outline-hidden focus-visible:ring-2"
                            >
                                <Card className="group-hover:bg-card/90 h-full transition-colors">
                                    <p className="mt-0! font-semibold tracking-tight">{c.title}</p>
                                    <p className="text-muted-foreground mt-1! text-sm leading-6">{c.description}</p>
                                </Card>
                            </button>
                        ))}
                    </div>
                </Section>
            </article>
        </Unstyled>
    );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
    return (
        <section className="flex flex-col gap-4 [&_p]:mt-0! [&_p]:leading-7">
            <h2 id={id} className="text-3xl font-semibold tracking-tight">
                {title}
            </h2>
            {children}
        </section>
    );
}

/** A code snippet on a glass panel, coloured by sugar-high. */
function Code({ code, language = 'typescript' }: { code: string; language?: 'typescript' | 'shell' | 'css' }) {
    return (
        <div className="glass overflow-hidden rounded-xl">
            <CodeBlock code={code} language={language} highlight={(c) => highlight(c, { lang: language })} />
        </div>
    );
}
