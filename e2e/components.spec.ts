import { expect, type Page, test } from '@playwright/test';

/** Opens a docs page once it's hydrated, failing the test on any console error. */
async function open(page: Page, path: string) {
    const errors: string[] = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    return errors;
}

/** The example whose heading is `title` (the first example has none: `null`). */
const example = (page: Page, title: string | null) =>
    title === null
        ? page
              .locator('main section')
              .filter({ has: page.getByRole('tab', { name: 'Preview' }) })
              .first()
        : page.locator('main section').filter({ has: page.getByRole('heading', { name: title, exact: true }) });

let errors: string[] = [];
test.afterEach(() => expect(errors, 'console errors').toEqual([]));

test('month picker: pick across years, respect the minimum, clear', async ({ page }) => {
    errors = await open(page, '/components/month-picker/');
    // Each field is inside its <label>, which names it.
    const end = example(page, 'Range').getByRole('button', { name: 'Ends' });
    await expect(end).toHaveText('Sep 2027');
    await end.click();
    await page.getByRole('button', { name: 'Previous year' }).click();
    // The end can't come before the month after the start (Oct 2026).
    await expect(page.getByRole('button', { name: 'October 2026' })).toBeDisabled();
    await page.getByRole('button', { name: 'Next year' }).click();
    await page.getByRole('button', { name: 'March 2027' }).click();
    await expect(end).toHaveText('Mar 2027');
    await end.click();
    await page.getByRole('dialog', { name: 'Choose month' }).getByRole('button', { name: 'No end' }).click();
    await expect(end).toHaveText('No end');
});

test('confirm dialog: opens as an alert dialog; cancel closes it', async ({ page }) => {
    errors = await open(page, '/components/dialog/');
    await page.getByRole('button', { name: 'Delete goal' }).click();
    const dialog = page.getByRole('alertdialog', { name: 'Delete this goal?' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
    await page.getByRole('button', { name: 'Delete goal' }).click();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
});

test('tabs: click and arrow keys switch panels', async ({ page }) => {
    errors = await open(page, '/components/tabs/');
    const tabs = example(page, null);
    await tabs.getByRole('tab', { name: 'Year' }).click();
    await expect(tabs.getByText('Spending for 2026 so far.')).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(tabs.getByRole('tab', { name: 'All time' })).toHaveAttribute('aria-selected', 'true');
    await expect(tabs.getByText('Everything since you started.')).toBeVisible();
});

test('toast: appears, is announced, and can be dismissed', async ({ page }) => {
    errors = await open(page, '/components/toast/');
    await page.getByRole('button', { name: 'Error', exact: true }).click();
    const toast = page.getByRole('alert').filter({ hasText: "Couldn't save" });
    await expect(toast).toBeVisible();
    await toast.getByRole('button', { name: 'Dismiss' }).click();
    await expect(page.getByText("Couldn't save")).toHaveCount(0);
});

test('table: a heading sorts, and sorts back the other way', async ({ page }) => {
    errors = await open(page, '/components/table/');
    const table = page.getByRole('region', { name: 'Repayment schedule' });
    await table.scrollIntoViewIfNeeded();
    const interest = table.getByRole('columnheader', { name: /Interest/ });
    const firstMonth = () => table.locator('tbody tr').first().locator('td').first().textContent();
    await interest.getByRole('button').click();
    await expect(interest).toHaveAttribute('aria-sort', /ascending|descending/);
    const first = await firstMonth();
    await interest.getByRole('button').click();
    expect(await firstMonth()).not.toBe(first);
});

test('tree table: groups collapse and expand; editing a cell updates the total', async ({ page }) => {
    errors = await open(page, '/components/tree/');
    const grid = page.getByRole('region', { name: 'Budget plan' });
    await grid.scrollIntoViewIfNeeded();
    const food = grid.getByRole('row').filter({ hasText: 'Food' }).first();
    await food.getByRole('button', { name: 'Collapse' }).click();
    await expect(grid.getByText('Groceries')).toHaveCount(0);
    await food.getByRole('button', { name: 'Expand' }).click();
    await expect(grid.getByText('Groceries')).toBeVisible();

    const total = grid.locator('tfoot td').nth(1);
    const before = await total.textContent();
    await grid.getByRole('button', { name: /^Groceries, Oct:/ }).click();
    const input = grid.getByLabel('Groceries, Oct');
    await input.fill('20000');
    await input.press('Enter');
    await expect(total).not.toHaveText(before!);

    // The header stays in view as the rows scroll.
    await grid.evaluate((el) => el.scrollTo(0, 400));
    await expect(grid.getByRole('columnheader').first()).toBeInViewport();
});

test("a dialog sits above a table's sticky cells, without scrolling itself", async ({ page }) => {
    errors = await open(page, '/showcase/');
    await page.getByRole('button', { name: 'Add entry' }).first().click();
    const dialog = page.getByRole('dialog');
    const save = dialog.getByRole('button', { name: /Add|Save/ }).last();
    const onTop = await save.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return el === hit || el.contains(hit);
    });
    expect(onTop).toBe(true);
    // The glowing border mustn't make the dialog scroll.
    expect(await dialog.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(false);
});

test('popups blur what is behind them', async ({ page }) => {
    errors = await open(page, '/components/select/');
    // Headless Chrome draws in software, so Zen picks lite graphics (no blur): ask for full.
    await page.evaluate(() => document.documentElement.setAttribute('data-zen-graphics', 'full'));
    const trigger = example(page, null).getByRole('button').last();
    await trigger.click();
    const panel = page.locator(':popover-open').first();
    await expect(panel).toBeVisible();
    expect(await panel.evaluate((el) => getComputedStyle(el).backdropFilter)).toContain('blur(18px)');
});

test("a menu doesn't move when the pointer leaves its (hover-scaled) trigger for the menu", async ({ page }) => {
    errors = await open(page, '/components/menu/');
    const trigger = page.getByRole('button', { name: 'Account menu' }).first();
    await trigger.hover();
    await trigger.click();
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    // Let its opening animation finish.
    await page.waitForTimeout(500);
    const before = await menu.boundingBox();
    const box = before!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
    await page.waitForTimeout(400);
    expect(await menu.boundingBox()).toEqual(before);
});
