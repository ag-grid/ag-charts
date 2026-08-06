import { defineConfig, devices } from '@playwright/test';

import baseConfig from './playwright.config';

/**
 * Cross-browser (Firefox + WebKit) e2e configuration.
 *
 * These projects deliberately live outside `playwright.config.ts` so they are excluded from the main
 * sharded e2e plan and run instead as their own CI job (`e2e-cross-browser`) with its own budget.
 * Everything except the project list and the report destinations is inherited from the main config,
 * so the two runs stay in step on `use`, `expect`, `webServer` and the retry/worker policy.
 *
 * Reports are written to distinct filenames: the artifacts of the two jobs are merged into one
 * directory by the report job, and `assign-e2e-shards.js` aggregates per-spec durations out of the
 * main JSON report to plan the shards — a cross-browser report under the same name would corrupt
 * both.
 *
 * Coverage is pinned to the vanilla framework variant by `skipNonChromiumNonVanilla` in `e2e/util.ts`,
 * applied by the specs themselves, so the pin holds on every CI event type.
 */
export default defineConfig({
    ...baseConfig,
    reporter: [
        [
            'html',
            {
                open: process.env.CI ? 'never' : 'on-failure',
                outputFolder: '../../reports/ag-charts-website-e2e-cross-browser-html/',
            },
        ],
        ['junit', { outputFile: '../../reports/ag-charts-website-e2e-cross-browser.xml' }],
        ['line'],
        ['json', { outputFile: '../../reports/ag-charts-website-e2e-cross-browser.json' }],
    ],
    outputDir: '../../reports/ag-charts-website-e2e-cross-browser-reports/',
    projects: [
        {
            name: 'firefox',
            use: {
                ...devices['Desktop Firefox'],
                viewport: {
                    width: 800,
                    height: 600,
                },
            },
            testMatch: '**/basic-chart.spec.ts',
        },

        {
            name: 'webkit',
            use: {
                ...devices['Desktop Safari'],
                viewport: {
                    width: 800,
                    height: 600,
                },
            },
            testMatch: '**/basic-chart.spec.ts',
        },
    ],
});
