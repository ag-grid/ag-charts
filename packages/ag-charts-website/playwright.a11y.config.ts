import { defineConfig } from '@playwright/test';

import baseConfig from './playwright.config';

/**
 * axe-core accessibility scan (`e2e/a11y-axe.spec.ts`), which fails on a violation that
 * `e2e/a11y/axe-allowlist.json` does not cover. With `AG_A11Y_ALL_EXAMPLES` set (the `a11y-all`
 * configuration) it scans every example and stays report-only, because the allowlist covers only the
 * default CI set.
 *
 * Runs the scan on its own as ci.yml's e2e_a11y job, so that job's artefact carries the whole report
 * instead of it landing on whichever e2e shard picked up the spec (the main config ignores it).
 * Everything except the test selection and the report destinations is inherited from the main
 * config (Chromium only).
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
