/**
 * The Kotlin docs pages as Kotlin, for the desktop docs app (kotlin/desktopApp, Docs.kt): each page's
 * title and lead, and its examples as the site shows them (the web example's words, the Kotlin
 * source, the story running it). Run by the desktop app's build: `node desktop-pages.ts <out.kt>`.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { docComment, orderExamples, titleFor } from '../app/example-source.ts';
import { componentsFor } from '../app/pages.ts';

const root = join(import.meta.dirname, '../..');
const showcase = join(root, 'kotlin/showcase/src/commonMain/kotlin/dev/rinzai/zen/showcase');
const read = (path: string) => {
    try {
        return readFileSync(path, 'utf8');
    } catch {
        return undefined;
    }
};

// As kotlin.ts finds them.
const storyOf = new Map(
    [...readFileSync(join(showcase, 'Stories.kt'), 'utf8').matchAll(/"([\w-]+--[\w-]+)" to \{ dev\.rinzai\.zen\.showcase\.examples\.(\w+)\.(\w+)\(\) \}/g)].map(
        ([, id, pkg, name]) => [`${pkg}/${name}`, id],
    ),
);

const kt = (s: string) =>
    `"${s.replace(/[\\"$\n\r\t]/g, (c) => ({ '\\': '\\\\', '"': '\\"', $: '\\$', '\n': '\\n', '\r': '\\r', '\t': '\\t' })[c]!)}"`;

const pages = componentsFor('kotlin').flatMap((doc) => {
    const folder = doc.folder ?? doc.slug;
    const pkg = doc.kotlinPackage || folder.replaceAll('-', '');
    const dir = join(root, 'web/packages', folder, 'examples');
    const web = readdirSync(dir, { withFileTypes: true })
        .filter((f) => f.isFile() && f.name.endsWith('.tsx'))
        .map((f) => ({ name: f.name.slice(0, -4), description: docComment(readFileSync(join(dir, f.name), 'utf8')) }));
    const examples = orderExamples(web, doc.examples).flatMap((e) => {
        const source = read(join(showcase, 'examples', pkg, `${e.name}.kt`));
        if (source === undefined) return [];
        const story = storyOf.get(`${pkg}/${e.name}`);
        return [
            `        DocExample(${kt(titleFor(e.name))}, ${e.description ? kt(e.description) : 'null'}, ${kt(source.replace(/^package [\w.]+\n\n/, ''))}, ${story ? kt(story) : 'null'}),`,
        ];
    });
    return [`    DocPage(${kt(doc.title)}, ${kt(doc.description)}, listOf(\n${examples.join('\n')}\n    )),`];
});

const out = process.argv[2];
mkdirSync(dirname(out), { recursive: true });
writeFileSync(
    out,
    `// Generated from docs/app/pages.ts by docs/scripts/desktop-pages.ts.
package dev.rinzai.zen.desktop

internal val DocPages = listOf(
${pages.join('\n')}
)
`,
);
