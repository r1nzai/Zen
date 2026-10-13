/**
 * The docs as markdown, for AI agents and anyone reading plain text: shipped in
 * the package as dist/docs/<slug>.md, and served on the site as /docs/<slug>.md,
 * /llms.txt and /llms-full.txt.
 */
import pkg from '../../package.json';
import { titleFor } from './example-source';
import type { ComponentDoc } from './pages';

export interface MarkdownExample {
    name: string;
    source: string;
}

/** One part's props, from its types: the site has them; the package has its .d.ts files instead. */
export interface MarkdownPart {
    name: string;
    description?: string;
    props: { name: string; type: string; required: boolean; defaultValue?: string; description?: string }[];
}

const SETUP = `Install with \`pnpm add @rinzai/zen\` (React 19 is the only peer dependency). In a Tailwind CSS v4 app, add Zen's theme after Tailwind:

\`\`\`css
@import 'tailwindcss';
@import '@rinzai/zen/tailwind.css';
\`\`\`

Without Tailwind, import the complete stylesheet once: \`import '@rinzai/zen/css';\`. Everything is imported from \`@rinzai/zen\`.`;

const cell = (text: string) => text.replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ');

export function componentMarkdown(doc: ComponentDoc, examples: MarkdownExample[], api?: MarkdownPart[]) {
    const out = [
        `# ${doc.title}`,
        doc.description,
        '```tsx\n' + `import { ${(doc.imports ?? doc.parts).join(', ')} } from '@rinzai/zen';` + '\n```',
    ];
    if (examples.length) out.push('## Examples');
    for (const example of examples) {
        out.push(`### ${titleFor(example.name)}`);
        out.push('```tsx\n' + example.source.trim() + '\n```');
    }
    if (api?.length) {
        out.push('## API reference');
        for (const part of api) {
            out.push(`### ${part.name}`);
            if (part.description) out.push(part.description);
            if (!part.props.length) {
                out.push('No props of its own; it accepts the props of the element it renders.');
                continue;
            }
            out.push(
                [
                    '| Prop | Type | Default | Description |',
                    '| --- | --- | --- | --- |',
                    ...part.props.map(
                        (p) =>
                            `| \`${p.name}\`${p.required ? ' (required)' : ''} | \`${cell(p.type)}\` | ${p.defaultValue ? `\`${cell(p.defaultValue)}\`` : ''} | ${cell(p.description ?? '')} |`,
                    ),
                ].join('\n'),
            );
        }
    } else if (doc.parts.length) {
        out.push(
            '## API reference',
            `Each part's props are in its TypeScript types (\`${doc.parts[0]}Props\` and so on), with a comment on every prop.`,
        );
    }
    return out.join('\n\n') + '\n';
}

/** The index: what Zen is, how to set it up, and a line per component linking to its page (`link`). */
export function indexMarkdown(components: ComponentDoc[], link: (slug: string) => string, more: string[] = []) {
    return (
        [
            '# Zen',
            `> ${pkg.description}`,
            SETUP,
            ...more,
            '## Components',
            [...components]
                .sort((a, b) => a.title.localeCompare(b.title))
                .map((c) => `- [${c.title}](${link(c.slug)}): ${c.description}`)
                .join('\n'),
        ].join('\n\n') + '\n'
    );
}
