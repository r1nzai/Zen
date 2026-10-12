import { createRequire } from 'node:module';

import { expect, type Page, test } from '@playwright/test';

import { COMPONENTS, componentPath } from '../docs/app/pages';
import { NOW } from './now';

const axe = createRequire(import.meta.url).resolve('axe-core');

interface Violation {
    id: string;
    help: string;
    nodes: { target: string[] }[];
}

/** axe's WCAG 2.1 A and AA violations on the page as it is now. */
async function violations(page: Page) {
    await page.addScriptTag({ path: axe });
    return page.evaluate(async () => {
        const result = await (
            window as unknown as { axe: { run: (o: object) => Promise<{ violations: Violation[] }> } }
        ).axe.run({
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
        });
        return result.violations.map(
            (v) => `${v.id}: ${v.help}\n    ${v.nodes.map((n) => n.target.join(' ')).join('\n    ')}`,
        );
    });
}

const PAGES = ['/showcase/', ...COMPONENTS.map((c) => componentPath(c.slug))];

/* Every docs page and the showcase, with each example as it first shows, in both themes; and no console errors. */
for (const colorScheme of ['dark', 'light'] as const) {
    test.describe(colorScheme, () => {
        test.use({ colorScheme });
        for (const path of PAGES) {
            test(`accessible: ${path}`, async ({ page }) => {
                // And hydrates cleanly: the server's HTML is what the browser would render.
                const errors: string[] = [];
                page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
                page.on('pageerror', (e) => errors.push(e.message));
                await page.clock.setSystemTime(new Date(NOW));
                await page.goto(path);
                await page.waitForLoadState('networkidle');
                const found = await violations(page);
                expect(found, found.join('\n')).toEqual([]);
                expect(errors, 'console errors').toEqual([]);
            });
        }
    });
}

/* Popups, open: their contents aren't in the page until then. */
const POPUPS: [string, Parameters<Page['getByRole']>[0], (page: Page) => Promise<unknown>][] = [
    ['select', 'listbox', (p) => p.getByRole('button', { name: 'Category' }).first().click()],
    ['combobox', 'listbox', (p) => p.getByRole('combobox', { name: 'Account' }).first().click()],
    ['menu', 'menu', (p) => p.getByRole('button', { name: 'Account menu' }).click()],
    ['popover', 'dialog', (p) => p.getByRole('button', { name: 'Preferences' }).click()],
    ['date-picker', 'dialog', (p) => p.getByRole('button', { name: 'Due date' }).click()],
    ['month-picker', 'dialog', (p) => p.getByRole('button', { name: 'Month' }).first().click()],
    [
        'color-picker',
        'dialog',
        (p) =>
            p
                .getByRole('button', { name: /colour/i })
                .first()
                .click(),
    ],
    ['icon-picker', 'dialog', (p) => p.getByRole('button', { name: /^Category icon/ }).click()],
    ['dialog', 'dialog', (p) => p.getByRole('button', { name: 'Rename' }).click()],
    [
        'command-palette',
        'dialog',
        (p) =>
            p
                .getByRole('button', { name: /Search/ })
                .first()
                .click(),
    ],
    ['tooltip', 'tooltip', (p) => p.locator('.zen__tooltip-trigger, [aria-describedby]').first().hover()],
];
for (const colorScheme of ['dark', 'light'] as const) {
    test.describe(colorScheme, () => {
        test.use({ colorScheme });
        for (const [slug, role, openIt] of POPUPS) {
            test(`accessible open: ${slug}`, async ({ page }) => {
                await page.clock.setSystemTime(new Date(NOW));
                await page.goto(componentPath(slug));
                await page.waitForLoadState('networkidle');
                await openIt(page);
                await expect(page.getByRole(role).first()).toBeVisible();
                const found = await violations(page);
                expect(found, found.join('\n')).toEqual([]);
            });
        }
    });
}
