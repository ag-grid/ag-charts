/**
 * Report-only axe-core accessibility scan of docs examples. Findings never fail a test: they are
 * attached to each test and aggregated by `e2e/a11y/axe-reporter.ts` into
 * `reports/a11y/axe-report.{json,html}` (in CI, only the shard that ran this spec carries it).
 *
 * The default run covers a representative set; `AG_A11Y_ALL_EXAMPLES=1` (or
 * `yarn nx test:e2e ag-charts-website --configuration=a11y-all`) scans every generated docs and
 * gallery example. axe only sees the DOM layer: canvas content, in-chart colour contrast and
 * screen-reader comprehension still need manual checks.
 */
import type { Page } from '@playwright/test';

import type { AxeExampleResult, AxePassName, AxePassResult } from '../scripts/a11y/axe-report';
import { runAxeScan, selectA11yExamples } from './a11y/axe-examples';
import { test } from './fixture';
import { SELECTORS, gotoExample, waitForAllChartUpdates } from './util';

const PASS_DEADLINE_MS = 35_000;

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

async function focusChart(page: Page) {
    const focusTarget = page.locator(SELECTORS.wrapper).first().locator('[tabindex="0"]').first();
    if ((await focusTarget.count()) > 0) {
        await focusTarget.focus();
    }
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowRight');
    await waitForAllChartUpdates(page);
}

test.describe('axe accessibility scan', () => {
    test.describe.configure({ retries: 0 });

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
            await test.info().attach('axe-results', { body: JSON.stringify(entry), contentType: 'application/json' });
        });
    }
});
