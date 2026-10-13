import { describe, expect, it } from 'vite-plus/test';

import { componentMarkdown, indexMarkdown } from './markdown';
import { COMPONENTS } from './pages';

const doc = { slug: 'thing', title: 'Thing', description: 'Does a thing.', parts: ['Thing', 'ThingPart'] };

describe('markdown docs', () => {
    it('gives a page its import and each example in full', () => {
        const md = componentMarkdown(doc, [
            { name: 'Default', source: 'export default 1;' },
            { name: 'WithLabel', source: 'export default 2;' },
        ]);
        expect(md).toContain("import { Thing, ThingPart } from '@rinzai/zen';");
        expect(md.indexOf('### Default')).toBeLessThan(md.indexOf('### With label'));
        expect(md).toContain('```tsx\nexport default 2;\n```');
        expect(md).toContain('`ThingProps`');
    });

    it('writes props as a table, with pipes in types escaped', () => {
        const md = componentMarkdown(
            doc,
            [],
            [{ name: 'Thing', props: [{ name: 'size', type: "'sm' | 'lg'", required: true, defaultValue: "'sm'" }] }],
        );
        expect(md).toContain("| `size` (required) | `'sm' \\| 'lg'` | `'sm'` |  |");
        expect(md).not.toContain('ThingProps');
    });

    it('links every page from the index', () => {
        const md = indexMarkdown(COMPONENTS, (slug) => `./${slug}.md`);
        for (const c of COMPONENTS) expect(md).toContain(`[${c.title}](./${c.slug}.md)`);
    });
});
