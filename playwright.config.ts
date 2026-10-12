import { defineConfig, devices } from '@playwright/test';

import { NOW } from './e2e/now';

/**
 * Browser tests for what jsdom can't check: layout, stacking, positioning and
 * real focus. They run against the docs site's examples. Behaviour runs in all
 * three engines; looks and axe in Chromium only (screenshots differ by engine
 * in font rendering alone, and axe reads the same tree in each).
 */
export default defineConfig({
    testDir: 'e2e',
    timeout: 60_000,
    retries: process.env.CI ? 1 : 0,
    // One look per platform, from Chromium (the only engine that takes them).
    snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}-{platform}{ext}',
    use: { baseURL: 'http://127.0.0.1:5191', colorScheme: 'dark' },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
            testMatch: ['components.spec.ts', 'keyboard.spec.ts'],
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
            testMatch: ['components.spec.ts', 'keyboard.spec.ts'],
        },
    ],
    webServer: {
        command: 'pnpm docs:dev --port 5191 --strictPort',
        env: { ZEN_TEST_NOW: NOW, NODE_OPTIONS: `--import ${import.meta.dirname}/e2e/server-clock.mjs` },
        url: 'http://127.0.0.1:5191',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
