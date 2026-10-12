import { expect, type Page, test } from '@playwright/test';

import { NOW } from './now';

/* Each component worked with the keyboard alone, from its docs example. */

let errors: string[] = [];
async function open(page: Page, path: string) {
    errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));
    await page.clock.setSystemTime(new Date(NOW));
    await page.goto(path);
    await page.waitForLoadState('networkidle');
}
test.afterEach(() => expect(errors, 'console errors').toEqual([]));

test('popover: Enter opens it, Tab goes in, Escape closes it back to the trigger', async ({ page }) => {
    await open(page, '/components/popover/');
    const trigger = page.getByRole('button', { name: 'Preferences' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    const panel = page.getByRole('dialog', { name: 'Preferences' });
    await expect(panel).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(panel.locator(':focus')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(trigger).toBeFocused();
});

test('dialog: focus moves in, Tab never reaches the page behind, Escape closes it back to the button', async ({
    page,
}) => {
    await open(page, '/components/dialog/');
    const button = page.getByRole('button', { name: 'Rename' });
    await button.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Rename category' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator(':focus')).toHaveCount(1);
    // The page behind is inert: Tab cycles through the dialog (and, natively, the browser's own controls).
    for (let i = 0; i < 6; i++) {
        await page.keyboard.press('Tab');
        const outside = await page.evaluate(
            () =>
                !!document.activeElement &&
                document.activeElement !== document.body &&
                !document.activeElement.closest('dialog'),
        );
        expect(outside).toBe(false);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(button).toBeFocused();
});

test('date picker: arrow keys move by day and week, Page Down by month, Enter picks', async ({ page }) => {
    await open(page, '/components/date-picker/');
    const trigger = page.getByRole('button', { name: 'Due date' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator(':focus')).toHaveAttribute('data-date', '2026-09-30');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('PageDown');
    await expect(page.locator(':focus')).toHaveAttribute('data-date', '2026-10-24');
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveText('24 Oct 2026');
    await expect(trigger).toBeFocused();
});

test('month picker: Enter opens it, Tab reaches the months, Enter picks one', async ({ page }) => {
    await open(page, '/components/month-picker/');
    const trigger = page.getByRole('button', { name: 'Month' }).first();
    await trigger.focus();
    await page.keyboard.press('Enter');
    const panel = page.getByRole('dialog', { name: 'Choose month' });
    await expect(panel).toBeVisible();
    const march = panel.getByRole('button', { name: 'March 2026' });
    for (let i = 0; i < 12 && !(await march.evaluate((el) => el === document.activeElement)); i++) {
        await page.keyboard.press('Tab');
    }
    await expect(march).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(panel).toBeHidden();
    await expect(trigger).toHaveText('Mar 2026');
});

test('pagination: Tab to next, Enter turns the page', async ({ page }) => {
    await open(page, '/components/pagination/');
    const next = page.getByRole('button', { name: 'Next page' });
    await next.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Page 7' })).toHaveAttribute('aria-current', 'page');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Page 8' })).toHaveAttribute('aria-current', 'page');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Page 12' })).toHaveAttribute('aria-current', 'page');
});

test('icon picker: arrow keys move through the icons, and the button says the choice', async ({ page }) => {
    await open(page, '/components/icon-picker/');
    const trigger = page.getByRole('button', { name: /^Category icon/ });
    await expect(trigger).toHaveAccessibleName('Category icon: Groceries, Teal');
    await trigger.focus();
    await page.keyboard.press('Enter');
    const icon = page.getByRole('radio', { name: 'Groceries' });
    for (let i = 0; i < 12 && !(await icon.evaluate((el) => el === document.activeElement)); i++) {
        await page.keyboard.press('Tab');
    }
    await expect(icon).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('radio', { name: 'Dining' })).toBeChecked();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAccessibleName('Category icon: Dining, Teal');
});

test('keypad: its keys are buttons that Enter and Space press', async ({ page }) => {
    await open(page, '/components/keypad/');
    await page.getByRole('button', { name: '4', exact: true }).focus();
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: '2', exact: true }).focus();
    await page.keyboard.press(' ');
    await expect(page.getByText('$42', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText('$4', { exact: true })).toBeVisible();
});

test('table: Enter on a heading sorts by it', async ({ page }) => {
    await open(page, '/components/table/');
    const interest = page
        .getByRole('region', { name: 'Repayment schedule' })
        .getByRole('columnheader', { name: /Interest/ });
    await interest.getByRole('button').focus();
    await page.keyboard.press('Enter');
    await expect(interest).toHaveAttribute('aria-sort', /ascending|descending/);
    const first = await interest.getAttribute('aria-sort');
    await page.keyboard.press(' ');
    await expect(interest).not.toHaveAttribute('aria-sort', first!);
});

test('range slider: arrow keys and Home/End move each thumb, never past the other', async ({ page }) => {
    await open(page, '/components/range-slider/');
    const low = page.getByRole('slider', { name: 'Minimum' });
    const high = page.getByRole('slider', { name: 'Maximum' });
    await low.focus();
    await page.keyboard.press('ArrowRight');
    await expect(low).toHaveAttribute('aria-valuetext', '$60');
    await high.focus();
    await page.keyboard.press('End');
    await expect(high).toHaveAttribute('aria-valuetext', '$1000');
    await page.keyboard.press('Home');
    expect(Number(await high.inputValue())).toBeGreaterThanOrEqual(60);
});

test('right to left: ArrowLeft moves to the next tab', async ({ page }) => {
    await open(page, '/components/locale-provider/');
    await page.getByRole('tab', { name: 'الشهر' }).focus();
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByRole('tab', { name: 'السنة' })).toHaveAttribute('aria-selected', 'true');
});
