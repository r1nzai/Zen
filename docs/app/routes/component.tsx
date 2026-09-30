import * as Zen from '@rinzai/zen';
import type { ComponentType } from 'react';
import { Link } from 'react-router';

import { CodeCard } from '../components/code-block';
import { DocsLayout, PageHeader } from '../components/docs-layout';
import { ExampleBlock } from '../components/example-block';
import { PropsTable } from '../components/props-table';
import { examplesFor } from '../examples';
import { COMPONENTS, componentPath } from '../pages';
import { breadcrumbs, seo } from '../seo';
import type { Route } from './+types/component';

export function meta({ params }: Route.MetaArgs) {
    const doc = COMPONENTS.find((c) => c.slug === params.slug);
    if (!doc) return [{ title: 'Not found · Zen' }, { name: 'robots', content: 'noindex' }];
    const path = componentPath(doc.slug);
    return seo({
        title: `${doc.title} · React component · Zen`,
        description: `${doc.description} Part of Zen, a dark-glass React component library.`,
        path,
        jsonLd: [
            breadcrumbs([
                { name: 'Zen', path: '/' },
                { name: doc.title, path },
            ]),
        ],
    });
}

export default function ComponentPage({ params }: Route.ComponentProps) {
    const index = COMPONENTS.findIndex((c) => c.slug === params.slug);
    const doc = COMPONENTS[index];
    if (!doc) {
        return (
            <DocsLayout>
                <PageHeader title="Not found" lead="There's no component with that name." />
            </DocsLayout>
        );
    }
    const examples = examplesFor(doc.folder ?? doc.slug, doc.examples);
    const [first, ...rest] = examples;
    const prev = COMPONENTS[index - 1];
    const next = COMPONENTS[index + 1];
    const toc = [
        ...rest.map((e) => ({ id: e.name.toLowerCase(), label: e.title })),
        ...(doc.parts.length ? [{ id: 'api', label: 'API reference' }] : []),
        ...doc.parts.map((p) => ({ id: `api-${p.toLowerCase()}`, label: p, depth: 2 })),
    ];

    return (
        <DocsLayout toc={toc}>
            <PageHeader eyebrow="Components" title={doc.title} lead={doc.description} />
            <div className="flex flex-col gap-12">
                {first && <ExampleBlock example={first} heading={false} />}

                <section className="flex flex-col gap-3">
                    <h2 className="text-2xl">Import</h2>
                    <CodeCard code={`import { ${(doc.imports ?? doc.parts).join(', ')} } from '@rinzai/zen';`} />
                </section>

                {rest.length > 0 && (
                    <section className="flex flex-col gap-10">
                        <h2 className="text-2xl">Examples</h2>
                        {rest.map((example) => (
                            <ExampleBlock key={example.name} example={example} />
                        ))}
                    </section>
                )}

                {doc.parts.length > 0 && (
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
                            to={componentPath(prev.slug)}
                            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
                        >
                            <Zen.ArrowLeft className="size-4" aria-hidden />
                            {prev.title}
                        </Link>
                    ) : (
                        <span />
                    )}
                    {next && (
                        <Link
                            to={componentPath(next.slug)}
                            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
                        >
                            {next.title}
                            <Zen.ArrowRight className="size-4" aria-hidden />
                        </Link>
                    )}
                </nav>
            </div>
        </DocsLayout>
    );
}
