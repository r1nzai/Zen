import { expect, test } from '@playwright/test';

import { COMPONENTS, componentPath } from '../docs/app/pages';

/*
 * Every example on every component page, against its last approved look.
 * Motion is off and the clock is fixed (examples show today's date), so a
 * difference is a real change. When a change is meant, approve the new look:
 * pnpm test:visual --update-snapshots
 */
test.use({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });

for (const { slug } of COMPONENTS) {
    test(`looks: ${slug}`, async ({ page }) => {
        await page.clock.setFixedTime(new Date('2026-10-06T12:00:00'));
        await page.goto(componentPath(slug));
        await page.waitForLoadState('networkidle');
        await page.evaluate(() => document.fonts.ready);
        const previews = page.locator('[role="tabpanel"][id$="-panel-preview"]');
        const count = await previews.count();
        for (let i = 0; i < count; i++) {
            const preview = previews.nth(i);
            await preview.scrollIntoViewIfNeeded();
            await expect(preview).toHaveScreenshot(`${slug}-${i + 1}.png`, { animations: 'disabled', caret: 'hide' });
        }
    });
}
