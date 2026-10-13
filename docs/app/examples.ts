import type { ComponentType } from 'react';

import { docComment, heroiconOf, orderExamples, shown, titleFor } from './example-source';

/** One example file from packages/<folder>/examples/<Name>.tsx: the component, and its source for the Code tab. */
export interface Example {
    name: string;
    title: string;
    description?: string;
    Component: ComponentType;
    source: string;
}

const modules = import.meta.glob<{ default: ComponentType }>('../../packages/*/examples/*.tsx', { eager: true });
const sources = import.meta.glob<string>('../../packages/*/examples/*.tsx', {
    eager: true,
    query: '?raw',
    import: 'default',
});

// Zen's own icons (Heroicons, not exported), by path: "icons/cog".
const icons = import.meta.glob<string>('../../packages/icons/**/*.tsx', {
    eager: true,
    query: '?raw',
    import: 'default',
});
const heroicon = new Map(
    Object.entries(icons).map(([path, code]) => [path.match(/packages\/(icons\/.+)\.tsx$/)![1], heroiconOf(code)]),
);

const byFolder = new Map<string, Example[]>();
for (const [path, mod] of Object.entries(modules)) {
    const [, folder, name] = path.match(/packages\/([^/]+)\/examples\/([^/]+)\.tsx$/)!;
    const source = sources[path];
    const list = byFolder.get(folder) ?? [];
    list.push({
        name,
        title: titleFor(name),
        description: docComment(source),
        Component: mod.default,
        source: shown(source, (path) => heroicon.get(path)),
    });
    byFolder.set(folder, list);
}

/** Examples for a folder: those named in `order` first, the rest alphabetically. */
export function examplesFor(folder: string, order: string[] = []): Example[] {
    return orderExamples(byFolder.get(folder) ?? [], order);
}
