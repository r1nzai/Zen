import { createRequire } from 'node:module';

import { expect, test } from '@playwright/test';

import { COMPONENTS, componentPath } from '../docs/app/pages';

const axe = createRequire(import.meta.url).resolve('axe-core');

interface Violation {
    id: string;
    help: string;
    nodes: { target: string[] }[];
}

/* Every docs page and the showcase through axe (WCAG 2.1 A and AA), with each example as it first shows. */
for (const path of ['/showcase/', ...COMPONENTS.map((c) => componentPath(c.slug))]) {
    test(`accessible: ${path}`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        await page.addScriptTag({ path: axe });
        const violations = await page.evaluate(async () => {
            const result = await (
                window as unknown as { axe: { run: (o: object) => Promise<{ violations: Violation[] }> } }
            ).axe.run({
                runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
            });
            return result.violations.map(
                (v) => `${v.id}: ${v.help}\n    ${v.nodes.map((n) => n.target.join(' ')).join('\n    ')}`,
            );
        });
        expect(violations, violations.join('\n')).toEqual([]);
    });
}
