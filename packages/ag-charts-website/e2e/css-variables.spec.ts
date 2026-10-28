import type { Page } from '@playwright/test';

import { expect, test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
import {
    SELECTORS,
    gotoExample,
    setupIntrinsicAssertions,
    toExamplePageUrl,
    toExamplePageUrls,
    waitForAllChartUpdates,
} from './util';

test.describe('css variables', () => {
    setupIntrinsicAssertions(test);

    for (const { framework, url } of toExamplePageUrls('themes-e2e', 'css-variables').filter(
        (f) => f.framework === 'vanilla'
    )) {
        test.describe(`for ${framework}`, () => {
            test('change value', async ({ page }) => {
                await gotoExample(page, url);
                await expectChartScreenshot(page, page.locator(SELECTORS.canvas), 'initial-value.png');

                await page.getByText('Change CSS Variable').click();
                await expectChartScreenshot(page, page.locator(SELECTORS.canvas), 'changed-value.png');

                await page.getByTitle('Change to Default Theme').click();
                await expectChartScreenshot(page, page.locator(SELECTORS.canvas), 'changed-theme.png');

                await page.getByTitle('Change to Default Theme').click();
                await page.getByText('Change CSS Variable').click();
                await expectChartScreenshot(page, page.locator(SELECTORS.canvas), 'change-value-same-theme.png');

                await page.getByTitle('Change to Paper Theme').click();
                await page.getByText('Change CSS Variable').click();
                await expectChartScreenshot(page, page.locator(SELECTORS.canvas), 'change-value-and-theme.png');
            });
        });
    }

    // The dark-mode example rebinds `--chart-*` CSS variables by toggling a `body` class; the charts
    // must re-resolve the theme and repaint without an explicit `chart.update()` call.
    test('dark mode toggles chart colours via CSS variables without chart.update()', async ({ page }) => {
        const { url } = toExamplePageUrl('themes-e2e', 'css-variables-dark-mode', 'vanilla');
        await gotoExample(page, url);

        const charts = page.locator('#charts');
        await expect(page.locator('#status')).toContainText('Mode: Light');
        await expectChartScreenshot(page, charts, 'css-variables-dark-mode-light.png');

        await page.getByText('Toggle Dark Mode').click();
        await waitForAllChartUpdates(page);
        await expect(page.locator('#status')).toContainText('Mode: Dark');
        await expectChartScreenshot(page, charts, 'css-variables-dark-mode-dark.png');

        // Toggling back must re-resolve the CSS variables and repaint to the original light appearance,
        // still without an explicit chart.update().
        await page.getByText('Toggle Dark Mode').click();
        await waitForAllChartUpdates(page);
        await expect(page.locator('#status')).toContainText('Mode: Light');
        await expectChartScreenshot(page, charts, 'css-variables-dark-mode-light-restored.png');
    });

    // A theme param blends `accentColor` onto a `var(--onto-color)` via `ontoColor`. Changing the CSS
    // variable must re-resolve and repaint the bars without an explicit `chart.update()` call.
    test('ontoColor blends onto a CSS variable and reacts to its changes', async ({ page }) => {
        const { url } = toExamplePageUrl('themes-e2e', 'css-variables-onto-color', 'vanilla');
        await gotoExample(page, url);
        await expectChartScreenshot(page, page.locator(SELECTORS.canvas), 'onto-color-initial.png');

        await page.getByText('Change CSS Variable').click();
        await waitForAllChartUpdates(page);
        await expectChartScreenshot(page, page.locator(SELECTORS.canvas), 'onto-color-changed.png');
    });
    // Moving between roots must clear the previous root's watchers; a leftover watcher doubles every refresh.
    test('moving a chart out of and back into a shadow root keeps a single CSS-variable watcher', async ({ page }) => {
        const { url } = toExamplePageUrl('themes-e2e', 'css-variables-shadow-root', 'vanilla');
        await gotoExample(page, url);

        // Watchers sit in a sensor element below the root they belong to, so count at any depth in each root.
        const countWatchers = () =>
            page.evaluate(() => ({
                shadow: document.getElementById('shadowHost')!.shadowRoot!.querySelectorAll('[data-variable-name]')
                    .length,
                light: document.querySelectorAll('[data-variable-name]').length,
            }));

        await page.getByText('Move to shadow root').click();
        await expect(page.locator('#shadowHost canvas')).toBeVisible();
        await waitForAllChartUpdates(page);
        const first = await countWatchers();
        expect(first.shadow).toBe(1);

        await page.getByText('Move to light DOM').click();
        await expect(page.locator('#myChart canvas')).toBeVisible();
        await waitForAllChartUpdates(page);
        expect((await countWatchers()).shadow).toBe(0);

        await page.getByText('Move to shadow root').click();
        await expect(page.locator('#shadowHost canvas')).toBeVisible();
        await waitForAllChartUpdates(page);
        expect(await countWatchers()).toEqual(first);
    });
    // A chart created on a detached container has no computed style to resolve a `var()` against, so what it
    // resolved then is re-resolved when the container is attached.
    test.describe('on a container that is attached after the chart is created', () => {
        type Scenario = 'series-fallback' | 'series-no-fallback' | 'theme-no-fallback' | 'series-unresolvable';
        type Target = 'shadow' | 'light';

        const RED = [255, 0, 0] as const;
        const BLUE = [0, 0, 255] as const;
        const GREEN = [0, 255, 0] as const;
        const YELLOW = [255, 255, 0] as const;
        const FALLBACK_GREEN = [0, 128, 0] as const;
        const DEFAULT_BAR = [80, 144, 220] as const;

        const targets: Target[] = ['shadow', 'light'];
        const hostSelector = (target: Target) => (target === 'shadow' ? '#shadowHost' : '#lightHost');

        const open = async (page: Page) => {
            const { url } = toExamplePageUrl('themes-e2e', 'css-variables-attach', 'vanilla');
            await gotoExample(page, url);
        };
        const create = async (page: Page, scenario: Scenario) => {
            await page.evaluate((s) => (window as any).createDetached(s), scenario);
        };
        const attach = async (page: Page, target: Target) => {
            await page.evaluate((t) => (window as any).attachTo(t), target);
            await expect(page.locator(`${hostSelector(target)} canvas`).first()).toBeVisible();
            await waitForAllChartUpdates(page);
        };
        const changeVariable = (page: Page) => page.evaluate(() => (window as any).changeCSSVariable());

        /** How many pixels of the attached chart's canvas are exactly `rgb`, or -1 if there is no canvas. */
        const countPixels = (page: Page, target: Target, rgb: readonly number[]) =>
            page.evaluate(
                ({ into, want }) => {
                    const host = document.querySelector<HTMLElement>(into === 'shadow' ? '#shadowHost' : '#lightHost');
                    const canvas = (host?.shadowRoot ?? host)?.querySelector('canvas');
                    const context = canvas?.getContext('2d');
                    if (!canvas || !context) return -1;
                    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
                    let count = 0;
                    for (let i = 0; i < data.length; i += 4) {
                        if (data[i] === want[0] && data[i + 1] === want[1] && data[i + 2] === want[2]) count++;
                    }
                    return count;
                },
                { into: target, want: rgb }
            );
        /** Whether the top-left pixel of the canvas, which only the chart background paints, is exactly `rgb`. */
        const cornerIs = async (page: Page, target: Target, rgb: readonly number[]) => {
            const pixel = await page.evaluate((into) => {
                const host = document.querySelector<HTMLElement>(into === 'shadow' ? '#shadowHost' : '#lightHost');
                const context = (host?.shadowRoot ?? host)?.querySelector('canvas')?.getContext('2d');
                return context ? Array.from(context.getImageData(0, 0, 1, 1).data) : [];
            }, target);
            return pixel.join() === [...rgb, 255].join();
        };

        const seriesIs = (page: Page, target: Target, rgb: readonly number[]) =>
            expect.poll(() => countPixels(page, target, rgb), { message: `bars painted ${rgb}` }).toBeGreaterThan(100);
        const seriesIsNot = async (page: Page, target: Target, rgb: readonly number[]) =>
            expect(await countPixels(page, target, rgb)).toBe(0);

        for (const target of targets) {
            test.describe(`into the ${target === 'shadow' ? 'shadow root' : 'light DOM'}`, () => {
                test('a var() with a fallback shows the value changed while detached', async ({ page }) => {
                    await open(page);
                    await create(page, 'series-fallback');
                    await changeVariable(page);

                    await attach(page, target);

                    await seriesIs(page, target, RED);
                    await seriesIsNot(page, target, FALLBACK_GREEN);
                    await seriesIsNot(page, target, BLUE);
                });

                test('a var() with a fallback shows the current value when it was not changed', async ({ page }) => {
                    await open(page);
                    await create(page, 'series-fallback');

                    await attach(page, target);

                    await seriesIs(page, target, BLUE);
                    await seriesIsNot(page, target, FALLBACK_GREEN);
                });

                test('a series var() with no fallback is applied once attached', async ({ page }) => {
                    await open(page);
                    await create(page, 'series-no-fallback');

                    await attach(page, target);

                    await seriesIs(page, target, BLUE);
                });

                test('a series var() with no fallback shows the value changed while detached', async ({ page }) => {
                    await open(page);
                    await create(page, 'series-no-fallback');
                    await changeVariable(page);

                    await attach(page, target);

                    await seriesIs(page, target, RED);
                    await seriesIsNot(page, target, BLUE);
                });

                test('a theme param var() with no fallback is applied once attached', async ({ page }) => {
                    await open(page);
                    await create(page, 'theme-no-fallback');

                    await attach(page, target);

                    await expect.poll(() => cornerIs(page, target, GREEN)).toBe(true);
                });

                test('a theme param var() with no fallback shows the value changed while detached', async ({
                    page,
                }) => {
                    await open(page);
                    await create(page, 'theme-no-fallback');
                    await changeVariable(page);

                    await attach(page, target);

                    await expect.poll(() => cornerIs(page, target, YELLOW)).toBe(true);
                });

                test('the caller theme params are left as given', async ({ page }) => {
                    await open(page);
                    await create(page, 'theme-no-fallback');
                    await attach(page, target);
                    await expect.poll(() => cornerIs(page, target, GREEN)).toBe(true);

                    const params = await page.evaluate(() => (window as any).themeParams() as string);

                    expect(JSON.parse(params)).toEqual({ backgroundColor: 'var(--attach-background)' });
                });

                test('a later change re-themes the chart without an options update', async ({ page }) => {
                    await open(page);
                    await create(page, 'series-no-fallback');
                    await attach(page, target);
                    await seriesIs(page, target, BLUE);

                    await changeVariable(page);

                    await seriesIs(page, target, RED);
                    await seriesIsNot(page, target, BLUE);
                });

                test('a later change re-themes a theme param without an options update', async ({ page }) => {
                    await open(page);
                    await create(page, 'theme-no-fallback');
                    await attach(page, target);
                    await expect.poll(() => cornerIs(page, target, GREEN)).toBe(true);

                    await changeVariable(page);

                    await expect.poll(() => cornerIs(page, target, YELLOW)).toBe(true);
                });
            });
        }

        for (const target of targets) {
            test(`nothing is warned about while detached, and a var() still unresolved once attached to the ${target === 'shadow' ? 'shadow root' : 'light DOM'} warns once [ignoreConsoleWarnings]`, async ({
                page,
            }) => {
                const warnings: string[] = [];
                page.on('console', (msg) => {
                    if (msg.text().includes('is not a valid color')) warnings.push(msg.text());
                });
                await open(page);
                await create(page, 'series-unresolvable');
                // Give the detached chart time to process its options and to settle.
                await page.evaluate(
                    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
                );
                expect(warnings).toHaveLength(0);

                await attach(page, target);

                await expect.poll(() => warnings.length).toBe(1);
                expect(warnings[0]).toContain('var(--attach-undefined)');
                // The unresolved fill is ignored, so the series is painted with the theme default.
                await seriesIs(page, target, DEFAULT_BAR);
                await changeVariable(page);
                await waitForAllChartUpdates(page);
                expect(warnings).toHaveLength(1);
                await seriesIs(page, target, DEFAULT_BAR);
                await seriesIsNot(page, target, RED);
            });
        }
    });
});
