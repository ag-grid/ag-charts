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
 * Coverage is pinned to the vanilla framework variant by `pinNonChromiumToVanilla` in `e2e/util.ts`,
 * applied by the specs themselves, so the pin holds on every CI event type. A spec added to
 * `PART_A_SPECS` below must therefore be vanilla-pinned — by that helper, by a self-filter, or by
 * only ever visiting hardcoded vanilla URLs.
 */

/**
 * Existing Chromium specs covering the failure classes that only reproduce outside Chromium: text
 * measurement, font and colour resolution, layout truncation, wheel/touch input, tooltip positioning
 * and Intl. The heaviest screenshot specs are deliberately left out to keep the job inside its
 * budget — highlight (316 s), legend (216 s), context-menu (171 s), keyboard-nav (143 s).
 */
const PART_A_SPECS = [
    '**/basic-chart.spec.ts',
    '**/fonts.spec.ts',
    '**/css-variables.spec.ts',
    '**/caption-tooltip.spec.ts',
    '**/zoom.spec.ts',
    '**/interactive-tooltip.spec.ts',
    '**/text-navigation.spec.ts',
    '**/legend-item-tooltip.spec.ts',
    '**/tooltip-offset.spec.ts',
    '**/localisation.spec.ts',
    '**/icons.spec.ts',
];

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
                // The desktop device descriptors default to `hasTouch: false`, so
                // `interactive-tooltip`'s `page.touchscreen.tap` case throws rather than running.
                hasTouch: true,
            },
            testMatch: PART_A_SPECS,
        },

        {
            name: 'webkit',
            use: {
                ...devices['Desktop Safari'],
                viewport: {
                    width: 800,
                    height: 600,
                },
                // See the firefox project: needed for `interactive-tooltip`'s tap case.
                hasTouch: true,
                // `Desktop Safari` is a retina descriptor (`deviceScaleFactor: 2`), unlike
                // `Desktop Chrome` and `Desktop Firefox`. The chart sizes its canvas element in
                // device pixels (`hdpiCanvas`: `element.width = cssWidth * pixelRatio`), and the
                // e2e helpers derive interaction coordinates from those attributes
                // (`locateCanvas` in `e2e/util.ts`), so at scale 2 every canvas point computed by a
                // spec lands at twice its intended offset — off the canvas entirely for anything
                // near the middle or the axes. Pinning to 1 keeps the three engines in the same
                // coordinate space, which is also what makes their baselines comparable.
                deviceScaleFactor: 1,
            },
            testMatch: PART_A_SPECS,
        },
    ],
});
