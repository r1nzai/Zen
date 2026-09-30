import type { ComponentType } from 'react';

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

const byFolder = new Map<string, Example[]>();
for (const [path, mod] of Object.entries(modules)) {
    const [, folder, name] = path.match(/packages\/([^/]+)\/examples\/([^/]+)\.tsx$/)!;
    const source = sources[path];
    const list = byFolder.get(folder) ?? [];
    list.push({ name, title: titleFor(name), description: docComment(source), Component: mod.default, source });
    byFolder.set(folder, list);
}

/** Examples for a folder: those named in `order` first, the rest alphabetically. */
export function examplesFor(folder: string, order: string[] = []): Example[] {
    const rank = (e: Example) => (order.includes(e.name) ? order.indexOf(e.name) : order.length);
    return [...(byFolder.get(folder) ?? [])].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}

/** "WithSpinner" → "With spinner" */
function titleFor(name: string) {
    const words = name.replace(/([a-z])([A-Z])/g, '$1 $2').split(' ');
    return [words[0], ...words.slice(1).map((w) => w.toLowerCase())].join(' ');
}

/** The JSDoc right above `export default`, as the example's description. */
function docComment(source: string) {
    // The body can't contain `*/`, so an earlier comment (on a field, say) isn't swept in.
    const match = source.match(/\/\*\*((?:(?!\*\/)[\s\S])*)\*\/\s*export default/);
    return match?.[1].replace(/^\s*\* ?/gm, '').trim();
}
