import { defineConfig, devices } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

function loadEnvFile(filePath: string): Record<string, string> {
    try {
        return Object.fromEntries(
            readFileSync(filePath, 'utf-8')
                .split('\n')
                .filter((l) => l !== '' && !l.startsWith('#') && l.includes('='))
                .map((l) => l.split('=', 2) as [string, string])
        );
    } catch {
        return {};
    }
}

const localE2eEnv = loadEnvFile(join(__dirname, '.env.test:e2e'));

/** An env var counts as set only when it is present and non-empty. */
const isCI = process.env.CI != null && process.env.CI !== '';

export default defineConfig({
    testDir: './e2e',
    testMatch: ['**/page-verification.spec.ts'],
    fullyParallel: true,
    workers: isCI ? 8 : undefined,
    forbidOnly: isCI,
    retries: isCI ? 2 : 0,
    reporter: [
        ['html', { open: isCI ? 'never' : 'on-failure' }],
        ['line'],
        [
            'playwright-ctrf-json-reporter',
            { outputDir: '../../reports', outputFile: 'ag-charts-page-verification.json' },
        ],
        ['./scripts/csp/cspViolationReporter.ts'],
    ],
    use: {
        ignoreHTTPSErrors: true,
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                launchOptions: { args: ['--ignore-certificate-errors'] },
            },
        },
    ],
    webServer:
        // Skip the local dev server when an external URL is already provided — mirrors how
        // ag-grid works: set PUBLIC_SITE_URL=https://charts-staging.ag-grid.com and tests
        // run directly against that URL with no local server.
        isCI ||
        process.env.HOSTNAME === 'docker-desktop' ||
        (process.env.PUBLIC_SITE_URL != null &&
            process.env.PUBLIC_SITE_URL !== '' &&
            !process.env.PUBLIC_SITE_URL.includes('localhost'))
            ? undefined
            : {
                  env: {
                      ...localE2eEnv,
                      PUBLIC_SITE_URL: 'http://localhost:4601',
                  },
                  command: 'npx astro dev --port=4601 --host',
                  url: 'http://localhost:4601/',
                  ignoreHTTPSErrors: true,
                  reuseExistingServer: true,
              },
});
