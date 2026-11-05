import { type Locator, Page } from '@playwright/test';

import { expect, test, waitForCharts } from './fixture';
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
    /**
     * The order in which the control sweep operates the example's controls. The sweep operates every
     * button, button-group label, radio, select and range, number and checkbox input inside
     * `.example-controls`, at any depth: a select moves to its next enabled option, a range or number
     * input to its step-aligned min (or max if already there; a number input without bounds to value
     * plus step). Controls are matched by element, not by an `on*` attribute, because framework variants
     * render none and some examples bind with `addEventListener`.
     */
    clickOrder: ClickOrder;
    /**
     * Controls whose operation is not expected to redraw the chart. After every other control, the first
     * chart must render again, or be replaced by a new chart that has rendered.
     *
     * Each entry matches a control by its `textContent` (buttons and button-group labels), its `#id`, or
     * for selects and inputs its `name` or its label's own text. `true` skips the check for every control
     * and needs a stated reason.
     */
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
const frameworkScopeValue = process.env.AG_E2E_FRAMEWORKS?.trim();
const frameworkScope =
    frameworkScopeValue == null || frameworkScopeValue === ''
        ? undefined
        : frameworkScopeValue
              .split(',')
              .map((fw) => fw.trim())
              .filter(Boolean);

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
        .map(({ url, example: pageExample, framework }): ExampleOptions => ({
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
        }));
}

// Native selectors only: the control is picked inside `page.evaluate`, not by a Playwright locator.
const SWEPT_CONTROLS = [
    'button:not([type=submit])',
    '.button-group > label',
    'input[type=radio]:not(.button-group input)',
    'select',
    'input[type=range]',
    'input[type=number]',
    'input[type=checkbox]',
]
    .map((selector) => `.example-controls ${selector}`)
    .join(', ');
const SWEPT_ATTR = 'data-e2e-swept';
const WRAPPER_MARK_ATTR = 'data-e2e-sweep-mark';

type SweptControl = {
    kind: 'button' | 'label' | 'radio' | 'checkbox' | 'select' | 'range' | 'number';
    skip: boolean;
    keys: string[];
    optionIndex?: number;
    value?: string;
};

/**
 * Tags the next control not yet swept (in DOM order, or reverse DOM order) and describes it. Picking
 * afresh each time keeps the sweep correct when an action adds, removes or re-renders controls.
 */
function nextControl(page: Page, reverse: boolean, tag: number) {
    return page.evaluate(
        ({ selector, sweptAttr, reverse, tag }): SweptControl | null => {
            const candidates = Array.from(document.querySelectorAll(selector)).filter(
                (el) => !el.hasAttribute(sweptAttr)
            );
            const el = reverse ? candidates.at(-1) : candidates[0];
            if (el == null) return null;
            el.setAttribute(sweptAttr, String(tag));

            const normalise = (text: string | null | undefined) => text?.replaceAll(/\s+/g, ' ').trim() ?? '';
            const keys: string[] = [];
            const addKey = (key: string | null | undefined) => {
                if (key) keys.push(key);
            };

            let kind: SweptControl['kind'];
            let input: HTMLInputElement | null = null;
            if (el instanceof HTMLButtonElement) {
                kind = 'button';
            } else if (el instanceof HTMLLabelElement) {
                kind = 'label';
                input = el.control instanceof HTMLInputElement ? el.control : null;
            } else if (el instanceof HTMLSelectElement) {
                kind = 'select';
            } else {
                input = el as HTMLInputElement;
                kind = input.type as SweptControl['kind'];
            }

            if (kind === 'button' || kind === 'label') {
                addKey(el.textContent);
                addKey(normalise(el.textContent));
                addKey(input?.id ? `#${input.id}` : undefined);
            }
            addKey(el.id ? `#${el.id}` : undefined);
            if (el instanceof HTMLSelectElement || el instanceof HTMLInputElement) {
                addKey(el.getAttribute('name'));
                const label = el.labels?.[0];
                if (label != null) {
                    const ownText = label.cloneNode(true) as HTMLLabelElement;
                    ownText.querySelectorAll('input, select, textarea, button').forEach((nested) => nested.remove());
                    addKey(normalise(ownText.textContent));
                }
            }

            const checkedRadio = input?.type === 'radio' && input.checked;
            const skip =
                !el.checkVisibility() ||
                el.matches(':disabled') ||
                input?.matches(':disabled') === true ||
                checkedRadio;
            const result: SweptControl = { kind, skip, keys };
            if (skip) return result;

            if (el instanceof HTMLSelectElement) {
                const options = Array.from(el.options);
                const current = options.findIndex((option) => option.value === el.value);
                for (let offset = 1; offset < options.length; offset++) {
                    const index = (current + offset) % options.length;
                    if (!options[index].disabled) {
                        result.optionIndex = index;
                        break;
                    }
                }
                result.skip = result.optionIndex == null;
            } else if (kind === 'range' || kind === 'number') {
                const step = Number(input!.step) || 1;
                const value = Number(input!.value) || 0;
                if (kind === 'number' && input!.min === '' && input!.max === '') {
                    result.value = String(value + step);
                } else {
                    const min = Number(input!.min || 0);
                    const max = min + Math.floor((Number(input!.max || 100) - min) / step) * step;
                    result.value = String(value === min ? max : min);
                }
            }
            return result;
        },
        { selector: SWEPT_CONTROLS, sweptAttr: SWEPT_ATTR, reverse, tag }
    );
}

async function operateControl(page: Page, control: Locator, { kind, optionIndex, value }: SweptControl) {
    if (kind === 'select') {
        await control.selectOption({ index: optionIndex! });
    } else if (value == null) {
        await control.click();
    } else {
        // Assigning `value` directly would update React's value tracker too, so React would not see a change.
        await control.evaluate((el: HTMLInputElement, newValue) => {
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, newValue);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }, value);
        await waitForCharts(page);
    }
}

/** Marks the first chart wrapper and returns its render count, so a redraw can be told from a replacement. */
function markFirstWrapper(page: Page) {
    return page.evaluate((markAttr) => {
        const wrapper = document.querySelector('.ag-charts-wrapper');
        wrapper?.setAttribute(markAttr, '');
        return Number(wrapper?.getAttribute('data-scene-renders'));
    }, WRAPPER_MARK_ATTR);
}

function firstWrapperRedrawn(page: Page, rendersBefore: number) {
    return page.evaluate(
        ({ markAttr, rendersBefore }) => {
            const wrapper = document.querySelector('.ag-charts-wrapper');
            if (wrapper == null) return false;
            const renders = Number(wrapper.getAttribute('data-scene-renders'));
            return wrapper.hasAttribute(markAttr) ? renders > rendersBefore : renders >= 1;
        },
        { markAttr: WRAPPER_MARK_ATTR, rendersBefore }
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

    // The title suffix is how createConsoleLogs learns to ignore this test's warnings.
    const titleSuffix = ignoreConsoleWarnings ? ' [ignoreConsoleWarnings]' : '';

    if (status === 'ok') {
        testFn(`should load ${url}${titleSuffix}`, async ({ page }) => {
            test.slow(framework === 'angular', 'allow more time for Angular load times');

            await gotoExample(page, url);

            await initialCallback?.(page);

            // Multi-chart examples are out of scope for the control sweep below.
            if ((await page.locator('.ag-charts-wrapper').count()) > 1) return;

            const controlCount = await page.evaluate(
                (selector) => document.querySelectorAll(selector).length,
                SWEPT_CONTROLS
            );
            const maxIterations = controlCount * 2 + 10;
            for (let tag = 0; ; tag++) {
                expect(tag, `more than ${maxIterations} controls swept; actions keep adding controls`).toBeLessThan(
                    maxIterations
                );

                const control = await nextControl(page, clickOrder === 'reverse', tag);
                if (control == null) break;
                if (control.skip) continue;

                await waitForCharts(page);
                const rendersBefore = await markFirstWrapper(page);

                await operateControl(page, page.locator(`[${SWEPT_ATTR}="${tag}"]`), control);

                const skipUpdateCheck =
                    skipCanvasUpdateCheck === true ||
                    (Array.isArray(skipCanvasUpdateCheck) &&
                        control.keys.some((key) => skipCanvasUpdateCheck.includes(key)));
                if (skipUpdateCheck) {
                    await page.waitForLoadState('networkidle');
                } else {
                    await expect
                        .configure({ message: `Operating ${control.kind} ${control.keys[0] ?? '(no key)'}` })
                        .poll(() => firstWrapperRedrawn(page, rendersBefore))
                        .toBe(true);
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
