import { defineConfig } from '@playwright/test';

import baseConfig from './playwright.config';

/**
 * Report-only axe-core accessibility scan (`e2e/a11y-axe.spec.ts`).
 *
 * Runs the scan on its own, so a dedicated CI job's artefact carries the whole report instead of it
 * landing on whichever e2e shard picked up the spec. Until ci.yml has that job, the spec also runs in
 * the main sharded plan. Everything except the test selection and the report destinations is
 * inherited from the main config (Chromium only).
 */
export default defineConfig({
    ...baseConfig,
    testIgnore: [],
    testMatch: '**/a11y-axe.spec.ts',
    reporter: [
        ['junit', { outputFile: '../../reports/ag-charts-website-e2e-a11y.xml' }],
        ['line'],
        ['json', { outputFile: '../../reports/ag-charts-website-e2e-a11y.json' }],
        ['./e2e/a11y/axe-reporter.ts'],
    ],
    outputDir: '../../reports/ag-charts-website-e2e-a11y-reports/',
});
