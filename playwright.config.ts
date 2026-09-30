import { defineConfig } from '@playwright/test';

/**
 * Browser tests for what jsdom can't check: layout, stacking, positioning and
 * real focus. They run against the docs site's examples.
 */
export default defineConfig({
    testDir: 'e2e',
    timeout: 60_000,
    retries: process.env.CI ? 1 : 0,
    use: { baseURL: 'http://127.0.0.1:5191', colorScheme: 'dark' },
    webServer: {
        command: 'pnpm docs:dev --port 5191 --strictPort',
        url: 'http://127.0.0.1:5191',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
