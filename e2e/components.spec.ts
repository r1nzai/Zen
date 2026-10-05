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
// An example's own section: the nearest round its heading (or first Preview tab), not the
// one holding all the examples, which has them too, and the other examples' content
// (e.g. a calendar showing the same day).
const example = (page: Page, title: string | null) =>
    (title === null
        ? page.getByRole('tab', { name: 'Preview' }).first()
        : page.getByRole('heading', { name: title, exact: true })
    ).locator('xpath=ancestor::section[1]');

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

test('toast: stacks into a deck that fans out when pointed at, and swipes away', async ({ page }) => {
    errors = await open(page, '/components/toast/');
    for (const name of ['Success', 'With action', 'Error'])
        await page.getByRole('button', { name, exact: true }).click();
    const deck = page.getByRole('region', { name: 'Notifications' });
    const saved = deck.getByRole('status').filter({ hasText: 'Saved' });
    const error = deck.getByRole('alert');
    const gap = async () => (await error.boundingBox())!.y - (await saved.boundingBox())!.y;
    await expect.poll(gap).toBeLessThan(40); // collapsed: only an edge peeks out
    await error.hover();
    await expect.poll(gap).toBeGreaterThan(150); // fanned out, one above another
    const box = (await saved.boundingBox())!;
    await page.mouse.move(box.x + 40, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    await expect(page.getByText('Your changes are stored.')).toHaveCount(0);
});

test('disclosure: grows open, folds shut, and leaves the page once shut', async ({ page }) => {
    errors = await open(page, '/components/disclosure/');
    const trigger = page.getByRole('button', { name: /Past/ }).first();
    await expect(page.getByText('Trip to Goa')).toHaveCount(0);
    await trigger.click();
    const content = page.locator('.zen__disclosure-content');
    const heights: number[] = [];
    for (let i = 0; i < 8; i++) {
        heights.push((await content.boundingBox())?.height ?? 0);
        await page.waitForTimeout(40);
    }
    expect(heights[0]).toBeLessThan(heights.at(-1)!); // grew, rather than appearing at full height
    await expect(page.getByText('Trip to Goa')).toBeVisible();
    await trigger.click();
    await expect(content).toHaveAttribute('inert', ''); // still there while it folds
    await expect(page.getByText('Trip to Goa')).toHaveCount(0);
});

test('without CSS anchor positioning, popups are still placed at their trigger', async ({ page }) => {
    // As in Safari before 26: the browser reports no position-area, so Zen places popups itself.
    await page.addInitScript(() => {
        const supports = CSS.supports.bind(CSS);
        // Both forms: supports('position-area', 'top') and supports('(position-area: top)').
        CSS.supports = ((property: string, value?: string) => {
            if (`${property}:${value ?? ''}`.includes('position-area')) return false;
            return value === undefined ? supports(property) : supports(property, value);
        }) as typeof CSS.supports;
    });
    errors = await open(page, '/components/dialog/');
    await page.getByRole('button', { name: 'Add budget' }).click();
    const dialog = page.locator('dialog[open]');
    const placement = async (trigger: import('@playwright/test').Locator) => {
        await trigger.click();
        const popup = page.locator('.zen__popover:popover-open');
        await expect(popup).toBeVisible();
        // Measured once it has finished scaling in.
        await popup.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
        const t = (await trigger.boundingBox())!;
        const p = (await popup.boundingBox())!;
        await page.keyboard.press('Escape');
        return { dx: Math.round(p.x - t.x), gap: Math.round(p.y - (t.y + t.height)), width: p.width >= t.width - 1 };
    };
    // Select: under its trigger, lined up, at least as wide.
    expect(await placement(dialog.getByRole('button', { name: 'Category' }))).toEqual({ dx: 0, gap: 4, width: true });
    // DatePicker: under its trigger, or above it if there's no room below.
    const date = await placement(dialog.getByRole('button', { name: 'Starts on' }));
    expect(date.dx).toBe(0);
    expect(date.gap === 4 || date.gap < -300).toBe(true);
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

test('date picker: opens focused on the date, the keyboard picks, and it renders the same on server and client', async ({
    page,
}) => {
    // Any hydration mismatch (e.g. from the engine's date formatting) shows up as a console error.
    errors = await open(page, '/components/date-picker/');
    const trigger = page.getByRole('button', { name: 'Due date' });
    await expect(trigger).toHaveText('30 Sept 2026');
    await trigger.click();
    await expect(page.getByRole('dialog', { name: 'Choose date' })).toBeVisible();
    await expect(page.locator(':focus')).toHaveAttribute('data-date', '2026-09-30');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveText('7 Oct 2026');
    await expect(page.getByRole('dialog', { name: 'Choose date' })).toBeHidden();
    await expect(trigger).toBeFocused();
});

test('calendar: a range previews while pointing, across months', async ({ page }) => {
    errors = await open(page, '/components/calendar/');
    const range = example(page, 'Range');
    await range.locator('[data-date="2026-10-20"]').click();
    await range.locator('[data-date="2026-11-03"]').hover();
    await expect(range.locator('td:has([data-date="2026-10-31"])')).toHaveClass(/bg-primary/);
    await range.locator('[data-date="2026-11-03"]').click();
    await expect(range.getByText(/20 Oct\s*–\s*3 Nov 2026 · 15 days/)).toBeVisible();
});

test('chart: draws after hydration, and the keyboard reads each row', async ({ page }) => {
    errors = await open(page, '/components/chart/');
    const plot = page.getByLabel('Income and spending by month: use the arrow keys to read values');
    await expect(plot.locator('path.zen__chart-grow')).toHaveCount(16);
    await plot.focus();
    await page.keyboard.press('ArrowRight');
    await expect(plot).toContainText('Apr');
    await expect(plot).toContainText('Income');
    await page.keyboard.press('End');
    await expect(plot).toContainText('Nov');
});

test('dialogs and sheets open on screen, even far down a scrolled page', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    errors = await open(page, '/components/dialog/');
    await page.getByRole('button', { name: 'Bottom sheet' }).click();
    const sheet = page.getByRole('dialog', { name: 'Filters' });
    await expect(sheet).toBeVisible();
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(300);
    const box = (await sheet.boundingBox())!;
    // Along the bottom edge of the screen, not the top of the document.
    expect(Math.round(box.y + box.height)).toBe(800);
    await expect(sheet.getByRole('button', { name: 'Apply' })).toBeInViewport();
});

test("a theme switch's wave is the only transition: no part animates its own colours under it", async ({ page }) => {
    errors = await open(page, '/showcase/');
    // Headless browsers render in software, which Zen treats as lite graphics (no wave).
    await page.evaluate(() => document.documentElement.setAttribute('data-zen-graphics', 'full'));
    const started = await page.evaluate(async () => {
        const runs: string[] = [];
        document.addEventListener('transitionrun', (e) => runs.push(e.propertyName), true);
        document.querySelector<HTMLButtonElement>('button[aria-label^="Switch to"]')!.click();
        await new Promise((resolve) => setTimeout(resolve, 1600));
        return runs;
    });
    await expect(page.locator('html')).toHaveClass(/\blight\b/);
    expect(started).toEqual([]);
});

test('a theme switch without the wave (lite graphics) changes at once: no part animates its own colours', async ({
    page,
}) => {
    errors = await open(page, '/showcase/');
    await page.evaluate(() => document.documentElement.setAttribute('data-zen-graphics', 'lite'));
    const started = await page.evaluate(async () => {
        const runs: string[] = [];
        document.addEventListener('transitionrun', (e) => runs.push(e.propertyName), true);
        document.querySelector<HTMLButtonElement>('button[aria-label^="Switch to"]')!.click();
        await new Promise((resolve) => setTimeout(resolve, 500));
        return runs;
    });
    await expect(page.locator('html')).toHaveClass(/\blight\b/);
    expect(started).toEqual([]);
    // Hovering still fades, once the theme has changed.
    await expect(page.locator('html')).not.toHaveAttribute('data-zen-theme-applying');
});

test('the aurora drifts on, moved 6 times a second rather than restyled every frame', async ({ page }) => {
    errors = await open(page, '/showcase/');
    await page.evaluate(() => document.documentElement.setAttribute('data-zen-graphics', 'full'));
    const read = () =>
        page.evaluate(() => {
            const aurora = document.querySelector('.zen-aurora')!;
            return {
                anims: aurora.getAnimations().map((a) => ({ state: a.playState, time: Number(a.currentTime) })),
                dx: getComputedStyle(aurora).getPropertyValue('--zen-a-dx'),
            };
        });
    await page.waitForTimeout(400);
    const before = await read();
    await page.waitForTimeout(2000);
    const after = await read();
    expect(after.anims).toHaveLength(3);
    after.anims.forEach((a, i) => {
        expect(a.state).toBe('paused');
        expect(a.time - before.anims[i].time).toBeGreaterThan(1600);
        expect(a.time - before.anims[i].time).toBeLessThan(2600);
    });
    expect(after.dx).not.toBe(before.dx);
});

test('the pointer light follows lit elements near it, re-measured when the page moves and found when added', async ({
    page,
}) => {
    // Headless browsers render in software, which Zen treats as lite graphics (no pointer light).
    // Set before the page's scripts run, once <html> exists.
    await page.addInitScript(() =>
        new MutationObserver((_, watch) => {
            if (!document.documentElement) return;
            document.documentElement.setAttribute('data-zen-graphics', 'full');
            watch.disconnect();
        }).observe(document, { childList: true }),
    );
    errors = await open(page, '/showcase/');
    // A lit element of our own, placed where we know: pointer offsets are exact.
    const add = (top: number) =>
        page.evaluate((top) => {
            const el = document.createElement('div');
            el.className = 'glow-edge';
            el.style.cssText = `position: fixed; left: 100px; top: ${top}px; width: 200px; height: 100px`;
            document.body.append(el);
            return document.querySelectorAll('.glow-edge').length - 1;
        }, top);
    const at = (i: number) =>
        page.evaluate((i) => {
            // What the edge layer paints with, whether Backdrop wrote attributes or properties.
            const edge = getComputedStyle(document.querySelectorAll('.glow-edge')[i], '::before');
            return [edge.getPropertyValue('--gx').trim(), edge.getPropertyValue('--gy').trim()];
        }, i);
    const near = await add(100);
    const far = await add(5000);
    await page.mouse.move(150, 130);
    await expect.poll(() => at(near)).toEqual(['50px', '30px']);
    expect(await at(far)).toEqual(['-9999px', '-9999px']);
    // Written as attributes where CSS reads them: an inline property would restyle all inside the element.
    const written = await page.evaluate((i) => {
        const el = document.querySelectorAll<HTMLElement>('.glow-edge')[i];
        return [el.getAttribute('data-zen-gx'), el.style.getPropertyValue('--gx')];
    }, near);
    expect(written).toEqual(['50px', '']);

    // The page moves under it: the next move measures it again.
    await page.evaluate((i) => (document.querySelectorAll<HTMLElement>('.glow-edge')[i].style.top = '60px'), near);
    await page.mouse.move(160, 130);
    await expect.poll(() => at(near)).toEqual(['60px', '70px']);

    // Added later, and near: lit.
    const added = await add(200);
    await page.mouse.move(170, 210);
    await expect.poll(() => at(added)).toEqual(['70px', '10px']);

    // A lit field put inside a lit element (an editing cell in a table panel) has no light
    // of its own until Backdrop places it, rather than its container's.
    const nested = await page.evaluate((i) => {
        const field = document.createElement('input');
        field.className = 'glow-border';
        document.querySelectorAll<HTMLElement>('.glow-edge')[i].append(field);
        return getComputedStyle(field).getPropertyValue('--gx').trim();
    }, added);
    expect(nested).toBe('-999px');
});
