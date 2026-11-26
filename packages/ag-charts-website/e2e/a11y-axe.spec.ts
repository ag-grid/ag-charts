/**
 * axe-core accessibility scan of docs examples. Each test attaches its findings, which
 * `e2e/a11y/axe-reporter.ts` aggregates into `reports/a11y/axe-report.{json,html}` plus a markdown summary
 * for the CI job summary, and then fails on any violation that `e2e/a11y/axe-allowlist.json` does not cover.
 *
 * Gate rules:
 * - An allowlist entry is a (rule, example) pair and covers both the load and the focus pass. More nodes
 *   under an allowlisted pair do not fail.
 * - Scan errors fail open: a pass that errored (load failure, timeout, or a focus pass skipped because load
 *   failed) never fails the test and is listed under "Scan errors" in the report. Allowlist entries for an
 *   example with any scan error are unverified, never reported as stale.
 * - Stale entries (the example scanned cleanly and the rule fired in neither pass) are reported, not failed.
 * - An invalid allowlist (missing rule, example or reason, or a duplicate pair) fails every test.
 * - `a11y-all` (`AG_A11Y_ALL_EXAMPLES`) stays report-only: the allowlist only covers the default CI set, so
 *   the full sweep attaches and reports, marking each violation as new or allowlisted, but never asserts.
 *
 * Runs only from `playwright.a11y.config.ts`: `yarn nx test:e2e ag-charts-website --configuration=a11y`
 * scans a representative set, and `--configuration=a11y-all` scans every generated docs and gallery
 * example. axe only sees the DOM layer: canvas content, in-chart colour contrast and
 * screen-reader comprehension still need manual checks.
 */
import type { Page } from '@playwright/test';

import { findNewViolations, formatNewViolations } from '../scripts/a11y/axe-allowlist';
import type { AxeExampleResult, AxePassName, AxePassResult } from '../scripts/a11y/axe-report';
import { loadAxeAllowlist } from './a11y/axe-allowlist';
import { isA11yAllExamples, runAxeScan, selectA11yExamples } from './a11y/axe-examples';
import { test } from './fixture';
import { SELECTORS, gotoExample, waitForAllChartUpdates } from './util';

const PASS_DEADLINE_MS = 35_000;

// Loaded once at module level so an invalid allowlist fails every test (fail closed).
const allowlist = loadAxeAllowlist();
const enforce = !isA11yAllExamples();

async function runPass(pass: AxePassName, action: () => Promise<Omit<AxePassResult, 'pass'>>): Promise<AxePassResult> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Timed out after ${PASS_DEADLINE_MS}ms`)), PASS_DEADLINE_MS);
    });
    try {
        return { pass, ...(await Promise.race([action(), deadline])) };
    } catch (e) {
        return { pass, error: e instanceof Error ? e.message : String(e) };
    } finally {
        clearTimeout(timer);
    }
}

/** Focuses the series area (falling back to the chart's first focusable element) and moves to the first datum. */
async function focusChart(page: Page) {
    const wrapper = page.locator(SELECTORS.wrapper).first();
    const seriesTarget = wrapper.locator(`${SELECTORS.seriesArea} [tabindex="0"]`).first();
    const focusTarget = (await seriesTarget.count()) > 0 ? seriesTarget : wrapper.locator('[tabindex="0"]').first();
    if ((await focusTarget.count()) > 0) {
        await focusTarget.focus();
    } else {
        await page.keyboard.press('Tab');
    }
    await page.keyboard.press('ArrowRight');
    await waitForAllChartUpdates(page);
}

test.describe('axe accessibility scan', () => {
    // Covers a Chromium launch crash. A violation outside the allowlist is deterministic, so it fails both attempts.
    test.describe.configure({ retries: 1 });

    for (const { pageName, example, url } of selectA11yExamples()) {
        test(`axe scan: ${pageName}/${example}`, async ({ page }) => {
            test.setTimeout(90_000);

            const load = await runPass('load', async () => {
                await gotoExample(page, url);
                return runAxeScan(page);
            });
            const focus =
                load.error == null
                    ? await runPass('focus', async () => {
                          await focusChart(page);
                          return runAxeScan(page);
                      })
                    : { pass: 'focus' as const, error: 'Skipped: load pass failed' };

            const entry: AxeExampleResult = {
                page: pageName,
                example,
                framework: 'vanilla',
                url,
                passes: [load, focus],
            };
            // Attach before asserting so the report survives a failing test.
            await test.info().attach('axe-results', { body: JSON.stringify(entry), contentType: 'application/json' });

            if (enforce) {
                const newViolations = findNewViolations(entry, allowlist);
                if (newViolations.length > 0) throw new Error(formatNewViolations(newViolations));
            }
        });
    }
});
