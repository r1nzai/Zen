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

/** One part's props, from its types. */
export interface MarkdownPart {
    name: string;
    description?: string;
    props: { name: string; type: string; required: boolean; defaultValue?: string; description?: string }[];
}

export interface DocgenProp {
    name: string;
    required: boolean;
    description: string;
    type: { name: string; raw?: string };
    defaultValue?: { value: string } | null;
}
export interface DocgenInfo {
    displayName: string;
    description: string;
    props: Record<string, DocgenProp>;
}

/**
 * A prop's type as text. Flat unions are sorted (null and undefined last): the
 * prerender and the client each get types from their own docgen run, which can
 * list union members in different orders and break hydration.
 */
export function typeText(type: DocgenProp['type']) {
    const text = type.raw ?? type.name;
    if (!text.includes(' | ') || /[()[\]{}<>]/.test(text)) return text;
    const last = (m: string) => Number(m === 'null' || m === 'undefined');
    return text
        .split(' | ')
        .sort((a, b) => last(a) - last(b) || a.localeCompare(b))
        .join(' | ');
}

/** Required props first, then by name. */
export const sortedProps = (info: DocgenInfo | undefined) =>
    Object.values(info?.props ?? {}).sort(
        (a, b) => Number(b.required) - Number(a.required) || a.name.localeCompare(b.name),
    );

/** Each part's props table, from its docgen info. */
export function apiFor(parts: string[], infoOf: (name: string) => DocgenInfo | undefined): MarkdownPart[] {
    return parts.map((name) => {
        const info = infoOf(name);
        return {
            name,
            description: info?.description,
            props: sortedProps(info).map((p) => ({
                name: p.name,
                type: typeText(p.type),
                required: p.required,
                defaultValue: p.defaultValue?.value,
                description: p.description,
            })),
        };
    });
}

/** README sections that are about the repo or the site rather than using Zen. */
const NOT_GUIDE = new Set(['For AI agents', "What's inside", 'Development', 'License']);

/** How to set up and use Zen, from the README: its sections, minus those about the repo and the site. */
export function guideFrom(readme: string) {
    return readme
        .split(/^(?=## )/m)
        .slice(1)
        .filter((section) => !NOT_GUIDE.has(section.slice(3, section.indexOf('\n')).trim()))
        .map((section) => section.trim())
        .join('\n\n');
}

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

/** The index: what Zen is, how to set it up and use it (`guide`), and a line per component linking to its page (`link`). */
export function indexMarkdown(
    components: ComponentDoc[],
    guide: string,
    link: (slug: string) => string,
    more: string[] = [],
) {
    return (
        [
            '# Zen',
            `> ${pkg.description}`,
            guide,
            ...more,
            '## Components',
            [...components]
                .sort((a, b) => a.title.localeCompare(b.title))
                .map((c) => `- [${c.title}](${link(c.slug)}): ${c.description}`)
                .join('\n'),
        ].join('\n\n') + '\n'
    );
}
