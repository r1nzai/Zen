import * as Zen from '@rinzai/zen';

import readme from '../../README.md?raw';
import { examplesFor } from './examples';
import { apiFor, componentMarkdown, type DocgenInfo, guideFrom, indexMarkdown } from './markdown';
import { COMPONENTS, type ComponentDoc, markdownPath } from './pages';
import { SITE } from './seo';

/** A docs page as markdown, with its props tables. */
export function pageMarkdown(doc: ComponentDoc) {
    const info = (name: string) =>
        (Zen as unknown as Record<string, { __docgenInfo?: DocgenInfo }>)[name]?.__docgenInfo;
    return componentMarkdown(doc, examplesFor(doc.folder ?? doc.slug, doc.examples), apiFor(doc.parts, info));
}

export function siteIndex() {
    return indexMarkdown(COMPONENTS, guideFrom(readme), (slug) => SITE + markdownPath(slug), [
        `In a project with Zen installed, the same pages are in node_modules/@rinzai/zen/dist/docs, for the installed version. All of them in one file: ${SITE}/llms-full.txt. Showcase apps: a budget app at ${SITE}/showcase/ and a music player at ${SITE}/showcase/music/.`,
    ]);
}

export const markdownResponse = (text: string) =>
    new Response(text, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
