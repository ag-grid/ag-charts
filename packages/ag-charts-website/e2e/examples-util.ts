import { type Locator, Page } from '@playwright/test';

import { expect, test } from './fixture';
import {
    SELECTORS,
    gotoExample,
    setupIntrinsicAssertions,
    toExamplePageUrls,
    toGalleryPageUrls,
    waitForAllChartUpdates,
} from './util';

export type Status = 'ok' | '404';
export type ClickOrder = 'normal' | 'reverse';

type ExampleCommonOptions = {
    status: Status;
    clickOrder: ClickOrder;
    skipCanvasUpdateCheck: boolean | string[];
    ignoreConsoleWarnings: boolean;
    randomData: boolean;
};

export type ExampleOptions = {
    pagePath: string;
    url: string;
    example: string;
    framework: string;
    snapshot: boolean;
} & ExampleCommonOptions;

export type ExampleOverrides = {
    frameworks?: string[];
    snapshot?: boolean;
} & Partial<ExampleCommonOptions>;

/**
 * Optional CI scoping of the framework variants swept by the generated example specs (and the
 * gallery/snapshot sweeps). Absent — the local default — every framework runs, so nothing changes
 * for developers or for callers that do not set it. CI narrows unchanged examples to `vanilla` on
 * PR runs, and keeps the full six-variant sweep on pushes to the baseline branches.
 *
 * An empty or whitespace-only value is treated as absent rather than as "no frameworks", so a
 * mis-set variable cannot silently reduce a run to zero tests.
 */
const frameworkScope = process.env.AG_E2E_FRAMEWORKS?.trim()
    ? process.env.AG_E2E_FRAMEWORKS.split(',')
          .map((fw) => fw.trim())
          .filter(Boolean)
    : undefined;

/**
 * Intersects a per-example `frameworks` override with the run's framework scope, so scoping can
 * only ever narrow an example's coverage.
 *
 * Every override in use today narrows to `vanilla` (optionally with `typescript`), so a `vanilla`
 * scope leaves them all with work to do. An override pinning an example to a variant outside the
 * scope would intersect to nothing and that example would not run on PRs — it still runs in full on
 * pushes, which is the coherent reading of "PR runs cover vanilla only". Widening the scope back up
 * to reach it would defeat the purpose.
 */
function scopeFrameworks(frameworks: string[] | undefined, changed: boolean): string[] | undefined {
    // Examples the branch actually touched are worth the full sweep, so they opt out of scoping.
    if (changed || frameworkScope == null) return frameworks;
    if (frameworks == null) return frameworkScope;
    return frameworks.filter((fw) => frameworkScope.includes(fw));
}

export async function triggerExampleTooltips(page: Page) {
    const wrappers = page.locator(SELECTORS.wrapper);
    const wrapperCount = await wrappers.count();

    for (let i = 0; i < wrapperCount; i++) {
        const wrapper = wrappers.nth(i);
        const focusTarget = wrapper.locator('[tabindex="0"]').first();

        if ((await focusTarget.count()) > 0) {
            await focusTarget.focus();
        }

        let tooltipVisible = await isTooltipVisible(wrapper);

        if (!tooltipVisible) {
            await page.keyboard.press('Tab');
            await waitForAllChartUpdates(page);
            tooltipVisible = await isTooltipVisible(wrapper);
        }

        if (!tooltipVisible) {
            await page.keyboard.press('ArrowRight');
            await waitForAllChartUpdates(page);
            tooltipVisible = await isTooltipVisible(wrapper);
        }

        await waitForAllChartUpdates(page);
    }
}

async function isTooltipVisible(wrapper: Locator) {
    const tooltips = wrapper.locator(SELECTORS.tooltip);
    if ((await tooltips.count()) === 0) {
        return false;
    }
    return tooltips.first().isVisible();
}

export function convertPageUrls(
    path: string,
    exampleOptions: Record<string, Record<string, ExampleOverrides>>,
    ignorePages = ['benchmarks'],
    /** Whether this example changed on the branch — see `scopeFrameworks`. */
    changed = false
) {
    const astroPath = path.split('content/').at(1)!;
    const [pagePath, examplePath] = astroPath.split('/_examples/');
    const example = examplePath.replace(/\/[a-zA-Z-]+\.ts$/, '');

    const page = pagePath.replace(/^docs\//, '');
    const pages = pagePath === 'gallery' ? toGalleryPageUrls(example) : toExamplePageUrls(page, example);

    if (ignorePages.some((m) => (typeof m === 'string' ? m === page : m.test(page)))) {
        return [];
    }

    let options = exampleOptions[page];
    if (options == null) {
        // eslint-disable-next-line no-restricted-properties
        for (const [key, value] of Object.entries(exampleOptions)) {
            if (!key.startsWith('/')) continue;
            const re = new RegExp(key.slice(1));
            if (re.test(page)) {
                options = value;
                break;
            }
        }
    }

    const defaults = pagePath.endsWith('-test')
        ? {
              frameworks: ['vanilla'],
          }
        : {};

    const {
        frameworks,
        status = 'ok',
        clickOrder = 'normal',
        skipCanvasUpdateCheck = false,
        ignoreConsoleWarnings = false,
        randomData = false,
        snapshot = false,
    } = {
        ...defaults,
        ...options?.['*'],
        ...options?.[example],
    };

    const scopedFrameworks = scopeFrameworks(frameworks, changed);

    return pages
        .filter((r) => scopedFrameworks?.includes(r.framework) !== false)
        .map(
            ({ url, example: pageExample, framework }): ExampleOptions => ({
                pagePath,
                url,
                example: pageExample,
                framework,
                status,
                clickOrder,
                skipCanvasUpdateCheck,
                ignoreConsoleWarnings,
                randomData,
                snapshot,
            })
        );
}

export function createTestCase(
    testFn: typeof test,
    opts: ExampleOptions,
    config: ReturnType<typeof setupIntrinsicAssertions>,
    initialCallback?: (page: Page) => Promise<void>,
    finalCallback?: (page: Page) => Promise<void>
) {
    const { url, status, framework, clickOrder, skipCanvasUpdateCheck, ignoreConsoleWarnings } = opts;

    // Use a special test title suffix to indicate console warnings should be ignored
    const titleSuffix = ignoreConsoleWarnings ? ' [ignoreConsoleWarnings]' : '';

    if (status === 'ok') {
        testFn(`should load ${url}${titleSuffix}`, async ({ page }) => {
            test.slow(framework === 'angular', 'allow more time for Angular load times');

            // Load example and wait for things to settle.
            await gotoExample(page, url);

            await initialCallback?.(page);

            // Check we're dealing with a single canvas, otherwise things get tricky!
            const canvases = await page.locator('.ag-charts-wrapper').all();
            if (canvases.length > 1) return;
            const canvas = canvases[0];

            // Try pressing the buttons and button group segments to see if any errors are thrown.
            // A button group's radio is hidden, so its label is the clickable part.
            const controls = await page
                .locator('.example-controls > button, .example-controls .button-group > label')
                .all();
            if (clickOrder === 'reverse') controls.reverse();

            for (const control of controls) {
                // Clicking the checked segment fires no change event, so it cannot redraw
                const isCheckedSegment = await control.evaluate(
                    (el) => el instanceof HTMLLabelElement && (el.control as HTMLInputElement | null)?.checked === true
                );
                if (isCheckedSegment) continue;

                const sceneRenderCount = Number(await canvas.getAttribute('data-scene-renders'));

                await control.click();

                const skip =
                    skipCanvasUpdateCheck === true ||
                    (Array.isArray(skipCanvasUpdateCheck) &&
                        skipCanvasUpdateCheck.includes((await control.textContent()) ?? 'unknown'));
                if (skip) {
                    await page.waitForLoadState('networkidle');
                } else {
                    await expect
                        .configure({
                            message: `Pressing ${await control.textContent()}`,
                        })
                        .poll(async () => Number(await canvas.getAttribute('data-scene-renders')))
                        .toBeGreaterThan(sceneRenderCount);
                }
            }

            await finalCallback?.(page);
        });
    }

    if (status === '404') {
        testFn(`should 404 on ${url}`, async ({ page }) => {
            await page.goto(url);
            expect(await page.title()).toMatch(/Page Not Found/);
        });
    }
}
