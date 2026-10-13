import * as Zen from '@rinzai/zen';

import type { DocgenInfo } from './components/props-table';
import { typeText } from './components/props-table';
import { examplesFor } from './examples';
import { componentMarkdown, indexMarkdown } from './markdown';
import { COMPONENTS, type ComponentDoc, markdownPath } from './pages';
import { SITE } from './seo';

/** A docs page as markdown, with its props tables (the package's copy has the .d.ts files instead). */
export function pageMarkdown(doc: ComponentDoc) {
    const api = doc.parts.map((name) => {
        const info = (Zen as unknown as Record<string, { __docgenInfo?: DocgenInfo }>)[name]?.__docgenInfo;
        const props = Object.values(info?.props ?? {}).sort(
            (a, b) => Number(b.required) - Number(a.required) || a.name.localeCompare(b.name),
        );
        return {
            name,
            description: info?.description,
            props: props.map((p) => ({
                name: p.name,
                type: typeText(p.type),
                required: p.required,
                defaultValue: p.defaultValue?.value,
                description: p.description,
            })),
        };
    });
    return componentMarkdown(doc, examplesFor(doc.folder ?? doc.slug, doc.examples), api);
}

export function siteIndex() {
    return indexMarkdown(COMPONENTS, (slug) => SITE + markdownPath(slug), [
        `In a project with Zen installed, the same pages are in node_modules/@rinzai/zen/dist/docs, for the installed version. All of them in one file: ${SITE}/llms-full.txt. Showcase app: ${SITE}/showcase/.`,
    ]);
}

export const markdownResponse = (text: string) =>
    new Response(text, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
