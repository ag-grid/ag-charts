import { defineConfig, devices } from '@playwright/test';

const PORT = 4700;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
    testDir: './e2e',
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
    webServer: {
        command: 'npx vite --port 4700',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
