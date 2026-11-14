import ArrowLeft from '@zen/icons/arrow-left';
import ArrowRight from '@zen/icons/arrow-right';
import * as Zen from '@rinzai/zen';
import type { ComponentType } from 'react';
import { Link, useLocation } from 'react-router';

import { CodeBlock, CodeCard } from '../components/code-block';
import { DocsLayout, PageHeader } from '../components/docs-layout';
import { ExampleBlock } from '../components/example-block';
import { PropsTable } from '../components/props-table';
import { examplesFor } from '../examples';
import { kotlinExample, kotlinPart } from '../kotlin';
import { componentPath, componentsFor, platformOf } from '../pages';
import { breadcrumbs, seo } from '../seo';
import type { Route } from './+types/component';

export function meta({ params, location }: Route.MetaArgs) {
    const platform = platformOf(location.pathname);
    const doc = componentsFor(platform).find((c) => c.slug === params.slug);
    if (!doc) return [{ title: 'Not found · Zen' }, { name: 'robots', content: 'noindex' }];
    const path = componentPath(doc.slug, platform);
    const kind = platform === 'kotlin' ? 'Compose Multiplatform' : 'React';
    return seo({
        title: `${doc.title} · ${kind} component · Zen`,
        description: `${doc.description} Part of Zen, a dark-glass ${kind} component library.`,
        path,
        jsonLd: [
            breadcrumbs([
                { name: 'Zen', path: platform === 'kotlin' ? '/kotlin/' : '/' },
                { name: doc.title, path },
            ]),
        ],
    });
}

export default function ComponentPage({ params }: Route.ComponentProps) {
    const platform = platformOf(useLocation().pathname);
    const components = componentsFor(platform);
    const index = components.findIndex((c) => c.slug === params.slug);
    const doc = components[index];
    if (!doc) {
        return (
            <DocsLayout>
                <PageHeader title="Not found" lead="There's no component with that name." />
            </DocsLayout>
        );
    }
    const kotlin = platform === 'kotlin';
    // On Kotlin pages, the examples the Kotlin library has, each with its web example's words.
    const examples = examplesFor(doc.folder ?? doc.slug, doc.examples)
        .map((example) => ({ example, kotlin: kotlin ? kotlinExample(doc, example.name) : undefined }))
        .filter((e) => !kotlin || e.kotlin);
    const [first, ...rest] = examples;
    const parts = kotlin ? doc.parts.flatMap((p) => kotlinPart(p) ?? []) : [];
    const prev = components[index - 1];
    const next = components[index + 1];
    const toc = [
        ...rest.map(({ example: e }) => ({ id: e.name.toLowerCase(), label: e.title })),
        ...(doc.parts.length ? [{ id: 'api', label: 'API reference' }] : []),
        ...(kotlin ? parts.map((p) => p.name) : doc.parts).map((p) => ({ id: `api-${p.toLowerCase()}`, label: p, depth: 2 })),
    ];

    return (
        <DocsLayout toc={toc}>
            <PageHeader eyebrow="Components" title={doc.title} lead={doc.description} />
            <div className="flex flex-col gap-12">
                {first && <ExampleBlock {...first} heading={false} />}

                <section className="flex flex-col gap-3">
                    <h2 className="text-2xl">Import</h2>
                    {kotlin ? (
                        <CodeCard lang="kotlin" code={parts.map((p) => `import ${p.qualified}`).join('\n')} />
                    ) : (
                        <CodeCard code={`import { ${(doc.imports ?? doc.parts).join(', ')} } from '@rinzai/zen';`} />
                    )}
                </section>

                {rest.length > 0 && (
                    <section className="flex flex-col gap-10">
                        <h2 className="text-2xl">Examples</h2>
                        {rest.map((e) => (
                            <ExampleBlock key={e.example.name} {...e} />
                        ))}
                    </section>
                )}

                {kotlin && parts.length > 0 && (
                    <section className="flex flex-col gap-8">
                        <h2 id="api" className="text-2xl">
                            API reference
                        </h2>
                        {parts.map((part) => (
                            <section key={part.name} className="flex flex-col gap-3">
                                <div className="flex items-baseline justify-between gap-4">
                                    <h3 id={`api-${part.name.toLowerCase()}`} className="font-mono text-base">
                                        {part.name}
                                    </h3>
                                    {/* A full page load: the reference is Dokka's own site. */}
                                    <a href={part.href} className="text-primary text-sm hover:underline">
                                        Parameters and docs
                                    </a>
                                </div>
                                <CodeBlock lang="kotlin" code={part.signatures.join('\n\n')} />
                            </section>
                        ))}
                    </section>
                )}

                {!kotlin && doc.parts.length > 0 && (
                    <section className="flex flex-col gap-8">
                        <h2 id="api" className="text-2xl">
                            API reference
                        </h2>
                        {doc.parts.map((part) => (
                            <PropsTable
                                key={part}
                                name={part}
                                component={(Zen as unknown as Record<string, ComponentType>)[part]}
                            />
                        ))}
                    </section>
                )}

                <nav
                    className="border-tint/[0.07] flex justify-between gap-4 border-t pt-8 text-sm"
                    aria-label="Pagination"
                >
                    {prev ? (
                        <Link
                            to={componentPath(prev.slug, platform)}
                            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
                        >
                            <ArrowLeft className="size-4" aria-hidden />
                            {prev.title}
                        </Link>
                    ) : (
                        <span />
                    )}
                    {next && (
                        <Link
                            to={componentPath(next.slug, platform)}
                            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
                        >
                            {next.title}
                            <ArrowRight className="size-4" aria-hidden />
                        </Link>
                    )}
                </nav>
            </div>
        </DocsLayout>
    );
}
