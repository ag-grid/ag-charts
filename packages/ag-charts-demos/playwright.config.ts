import { defineConfig, devices } from '@playwright/test';

const PORT = 4700;
// DEMOS_BASE_URL points the functional specs at an app served elsewhere, such as a framework port
// of a demo (see e2e/parity/README.md); the dev server is then not started.
const baseURL = process.env.DEMOS_BASE_URL?.replace(/\/+$/, '') ?? `http://localhost:${PORT}`;

export default defineConfig({
    testDir: './e2e',
    // The parity harness has its own config (playwright.parity.config.ts) and servers.
    testIgnore: '**/parity/**',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 2 : undefined,
    reporter: process.env.CI
        ? [['junit', { outputFile: '../../reports/ag-charts-demos-e2e.xml' }], ['line']]
        : [['line']],
    use: {
        baseURL,
        trace: 'on-first-retry',
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: process.env.DEMOS_BASE_URL
        ? undefined
        : {
              command: 'npx vite',
              url: baseURL,
              reuseExistingServer: !process.env.CI,
              timeout: 120_000,
          },
});
