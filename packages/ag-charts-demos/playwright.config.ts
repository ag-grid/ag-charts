import { defineConfig, devices } from '@playwright/test';

const PORT = 4700;
// DEMOS_BASE_URL points the functional specs at an app served elsewhere, such as a framework port
// of a demo (see e2e/parity/README.md); the dev server is then not started.
const isCI = process.env.CI != null && process.env.CI !== '';
const externalBaseURL = process.env.DEMOS_BASE_URL != null && process.env.DEMOS_BASE_URL !== '';
const baseURL = process.env.DEMOS_BASE_URL?.replace(/\/+$/, '') ?? `http://localhost:${PORT}`;

export default defineConfig({
    testDir: './e2e',
    // The parity harness has its own config (playwright.parity.config.ts) and servers.
    testIgnore: '**/parity/**',
    fullyParallel: true,
    forbidOnly: isCI,
    retries: isCI ? 2 : 0,
    workers: isCI ? 2 : undefined,
    reporter: isCI ? [['junit', { outputFile: '../../reports/ag-charts-demos-e2e.xml' }], ['line']] : [['line']],
    use: {
        baseURL,
        trace: 'on-first-retry',
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: externalBaseURL
        ? undefined
        : {
              command: 'npx vite',
              url: baseURL,
              reuseExistingServer: !isCI,
              timeout: 120_000,
          },
});
