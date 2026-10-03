import { buttonVariants, Card } from '@rinzai/zen';
import { Link } from 'react-router';

import { CodeCard } from '../components/code-block';
import { DocsLayout } from '../components/docs-layout';
import { COMPONENTS, componentPath } from '../pages';
import { LIBRARY_LD, seo, SITE, SITE_NAME } from '../seo';

export const meta = () =>
    seo({
        title: 'Zen · React components in dark glass',
        description:
            'A React component library in dark glass: translucent surfaces, borders that catch a pointer light, one accent colour. Tailwind v4, zero dependencies.',
        path: '/',
        jsonLd: [LIBRARY_LD, { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: SITE }],
    });

const TOC = [
    { id: 'installation', label: 'Installation' },
    { id: 'usage', label: 'Usage' },
    { id: 'background', label: 'Background' },
    { id: 'theming', label: 'Theming' },
    { id: 'browsers', label: 'Browser support' },
    { id: 'components', label: 'Components' },
];

export default function Home() {
    return (
        <DocsLayout toc={TOC}>
            <header className="mb-16 flex flex-col gap-5">
                <h1 className="text-aurora text-5xl lg:text-6xl">Zen</h1>
                <p className="text-muted-foreground mt-0! max-w-2xl text-lg leading-relaxed">
                    React components in dark glass: translucent surfaces, hairline borders that catch a pointer light,
                    and one accent colour carrying the UI. {COMPONENTS.length} components, dark and light, built on
                    native platform features (<code>{'<dialog>'}</code>, the Popover API, radio inputs) with no runtime
                    dependencies.
                </p>
                <div className="flex flex-wrap gap-3">
                    <a href="#installation" className={buttonVariants()}>
                        Get started
                    </a>
                    <Link to="/showcase/" className={buttonVariants({ variant: 'outline' })}>
                        See it in an app
                    </Link>
                </div>
            </header>

            <div className="flex flex-col gap-14">
                <section className="flex flex-col gap-4">
                    <h2 id="installation">Installation</h2>
                    <CodeCard lang="shell" code="pnpm add @rinzai/zen" />
                    <p>
                        <strong>Using Tailwind CSS v4?</strong> Add Zen's theme after Tailwind in your stylesheet. Your
                        one Tailwind build then generates everything Zen's components use.
                    </p>
                    <CodeCard
                        lang="css"
                        code={`
@import 'tailwindcss';
@import '@rinzai/zen/tailwind.css';`}
                    />
                    <p>
                        <strong>Not using Tailwind?</strong> Import the complete stylesheet once, near the root of your
                        app. It includes the default theme.
                    </p>
                    <CodeCard code={`import '@rinzai/zen/css';`} />
                    <p>
                        Zen never styles your own elements. For its page setup (the background showing through), heading
                        scale, inline code and quiet scrollbars, also add the optional base:
                    </p>
                    <CodeCard lang="css" code={`@import '@rinzai/zen/base.css';`} />
                    <p>
                        The look is set in{' '}
                        <a href="https://vercel.com/font" className="text-primary underline-offset-4 hover:underline">
                            Geist
                        </a>
                        . Load it however you like, for example with <code>@fontsource-variable/geist</code>.
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
            <Card><CardHeader><CardTitle>Budget</CardTitle></CardHeader>
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
                        <Link
                            to={componentPath('backdrop')}
                            className="text-primary underline-offset-4 hover:underline"
                        >
                            Backdrop
                        </Link>{' '}
                        draws the page background and lights up card edges near the pointer. It sits at{' '}
                        <code>z-index: -1</code>, so <code>{'<html>'}</code> needs the background colour and{' '}
                        <code>{'<body>'}</code> must stay transparent. The optional base does this; without it:
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
                    <h2 id="browsers">Browser support</h2>
                    <p>
                        Chrome and Edge 114+, Safari 17+ and Firefox 128+: the versions with the native Popover API that
                        popups, menus and toasts are built on, and with what Tailwind v4 needs.
                    </p>
                    <ul className="text-muted-foreground flex list-disc flex-col gap-2 pl-5">
                        <li>
                            Popups are placed with CSS anchor positioning where the browser has it (Chrome 129+, Safari
                            26+, recent Firefox). Elsewhere Zen places them itself, the same way.
                        </li>
                        <li>
                            Glass is blurred live where there&rsquo;s a GPU and a mouse. On touch screens, without
                            hardware acceleration, and with the OS&rsquo;s &ldquo;reduce transparency&rdquo;, surfaces
                            are solid instead.
                        </li>
                        <li>
                            Motion such as entry animations is left out where a browser lacks it, and for anyone who
                            prefers reduced motion.
                        </li>
                    </ul>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 id="components">Components</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {COMPONENTS.map((c) => (
                            <Link
                                key={c.slug}
                                to={componentPath(c.slug)}
                                className="group focus-visible:ring-glow/50 rounded-xl outline-hidden focus-visible:ring-2"
                            >
                                <Card className="group-hover:bg-card/90 h-full transition-colors">
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
