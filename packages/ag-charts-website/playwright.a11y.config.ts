import { defineConfig } from '@playwright/test';

import baseConfig from './playwright.config';

/**
 * Report-only axe-core accessibility scan (`e2e/a11y-axe.spec.ts`).
 *
 * Kept out of `playwright.config.ts` so the scan runs as its own CI job, whose artefact carries the
 * whole report, instead of landing on whichever e2e shard picked up the spec. Everything except the
 * test selection and the report destinations is inherited from the main config (Chromium only).
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
