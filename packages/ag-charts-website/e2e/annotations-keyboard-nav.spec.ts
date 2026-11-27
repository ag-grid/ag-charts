import type { Locator, Page } from '@playwright/test';

import { getChartState, setChartState } from './agE2E';
import { expect, test } from './fixture';
import { gotoExample, setupIntrinsicAssertions, toExamplePageUrl, waitForChartUpdate } from './util';

// The series widget swaps between two elements; only the one currently exposed to assistive technology takes focus.
const SWAPCHAIN = '.ag-charts-swapchain[aria-hidden="false"]';

// The fixture's axes both span 0 to 100.
const LINE_ANNOTATIONS = [
    { type: 'horizontal-line', value: 30 },
    { type: 'horizontal-line', value: 60 },
];

function annotationItems(page: Page): Locator {
    return page.getByRole('list', { name: 'Annotations' }).getByRole('button');
}

function optionsToolbar(page: Page): Locator {
    return page.getByRole('dialog', { name: 'Annotation Options' });
}

async function getHorizontalLineValues(page: Page): Promise<number[]> {
    const annotations = (await getChartState(page)).annotations ?? [];
    return annotations.map((annotation) => (annotation as { value: number }).value);
}

/** Tabs from the series area to the annotations, as a keyboard user would. */
async function tabToAnnotations(page: Page) {
    await page.locator(SWAPCHAIN).focus();
    await page.keyboard.press('Tab');
}

async function setAnnotations(page: Page, annotations: object[]) {
    const state = await getChartState(page);
    await setChartState(page, { ...state, annotations: annotations as typeof state.annotations });
}

async function updateChart(page: Page, options: object) {
    await page.evaluate((delta) => (window as any).agE2E.chart.updateDelta(delta), options);
    await waitForChartUpdate(page.locator('.ag-charts-wrapper'));
}

/** Clicks the middle of the series area at a height given as a fraction of it, from the top. */
async function clickSeriesArea(page: Page, fromTop: number) {
    const seriesArea = await page.locator('.ag-charts-series-area').boundingBox();
    await page.mouse.click(seriesArea!.x + seriesArea!.width / 2, seriesArea!.y + seriesArea!.height * fromTop);
}

async function openOptionsFromKeyboard(page: Page) {
    await tabToAnnotations(page);
    await page.keyboard.press('Enter');
    await expect(optionsToolbar(page)).toBeVisible();
}

async function clickFirstLine(page: Page) {
    // The first line is at 30 on a 0 to 100 y axis.
    await clickSeriesArea(page, 0.7);
    await expect(optionsToolbar(page)).toBeVisible();
}

/** Starts the Move Annotation flow on the first annotation, leaving the focus on the annotation's mover. */
async function startMove(page: Page) {
    await openOptionsFromKeyboard(page);
    await optionsToolbar(page).getByRole('button', { name: 'Move Annotation' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator(':focus')).toHaveAccessibleName('Moving annotation');
}

test.describe('annotations keyboard navigation', () => {
    setupIntrinsicAssertions(test);

    const { url } = toExamplePageUrl('annotations-e2e', 'keyboard-create', 'vanilla');

    test.beforeEach(async ({ page }) => {
        await gotoExample(page, url);
        const state = await getChartState(page);
        await setChartState(page, { ...state, annotations: LINE_ANNOTATIONS as typeof state.annotations });
    });

    test('Tab moves from the series area to the first annotation, and the arrow keys to the next', async ({ page }) => {
        await tabToAnnotations(page);

        await expect(annotationItems(page).first()).toBeFocused();
        await expect(annotationItems(page).first()).toHaveAccessibleName('30, Horizontal Line annotation');
        await expect(annotationItems(page).first()).toHaveAttribute('aria-haspopup', 'dialog');
        await expect(annotationItems(page).first()).toHaveAttribute('aria-expanded', 'false');

        await page.keyboard.press('ArrowDown');

        await expect(annotationItems(page).nth(1)).toBeFocused();
        await expect(annotationItems(page).nth(1)).toHaveAccessibleName('60, Horizontal Line annotation');
    });

    test('Enter opens the Annotation Options Toolbar, and Escape returns to the annotation', async ({ page }) => {
        await tabToAnnotations(page);

        await page.keyboard.press('Enter');

        await expect(optionsToolbar(page)).toBeVisible();
        await expect(optionsToolbar(page).getByRole('button').first()).toBeFocused();
        await expect(annotationItems(page).first()).toHaveAttribute('aria-expanded', 'true');

        await page.keyboard.press('Escape');

        await expect(optionsToolbar(page)).toHaveCount(0);
        await expect(annotationItems(page).first()).toBeFocused();
        await expect(annotationItems(page).first()).toHaveAttribute('aria-expanded', 'false');
    });

    test('Move Annotation moves the annotation with the arrow keys, and Escape returns to the button', async ({
        page,
    }) => {
        await tabToAnnotations(page);
        await page.keyboard.press('Enter');
        const moveButton = optionsToolbar(page).getByRole('button', { name: 'Move Annotation' });
        await moveButton.focus();

        await page.keyboard.press('Enter');

        await expect(optionsToolbar(page)).toHaveCount(0);
        await expect(page.locator(':focus')).toHaveAccessibleName('Moving annotation');
        await expect(page.locator(':focus')).toHaveAccessibleDescription(/arrow keys/);

        await page.keyboard.press('ArrowUp');

        const [moved, unmoved] = await getHorizontalLineValues(page);
        expect(moved).toBeGreaterThan(30);
        expect(unmoved).toBe(60);
        // Only what the move changed is announced: the line's new value.
        await expect(page.locator(':focus')).toHaveAccessibleName(/^3\d\.\d+$/);

        await page.keyboard.press('Escape');

        await expect(moveButton).toBeFocused();
    });

    const toolbarOpeners = [
        { opener: 'the keyboard', open: openOptionsFromKeyboard },
        { opener: 'a pointer', open: clickFirstLine },
    ];
    for (const { opener, open } of toolbarOpeners) {
        for (const name of ['Line Style', 'Line Stroke Width']) {
            test(`The ${name} dropdown of a toolbar opened by ${opener} returns focus to its button`, async ({
                page,
            }) => {
                await open(page);
                const button = optionsToolbar(page).getByRole('button', { name });
                const menu = page.getByRole('menu');
                await button.focus();
                const before = await getChartState(page);

                await page.keyboard.press('Enter');
                await expect(menu).toBeVisible();
                await page.keyboard.press('Escape');

                await expect(menu).toHaveCount(0);
                await expect(button).toBeFocused();

                await page.keyboard.press('Enter');
                // The dropdown opens on its first item, which may be the current value.
                await page.keyboard.press('ArrowDown');
                await page.keyboard.press('ArrowDown');
                await page.keyboard.press('Enter');

                await expect(menu).toHaveCount(0);
                await expect(button).toBeFocused();
                expect((await getChartState(page)).annotations?.[0]).not.toEqual(before.annotations?.[0]);
            });
        }
    }

    test('The Text Size dropdown returns focus to its button after Enter picks a size', async ({ page }) => {
        const state = await getChartState(page);
        const text = { type: 'text', text: 'Hello', x: 50, y: 50 };
        await setChartState(page, { ...state, annotations: [text] as typeof state.annotations });
        await openOptionsFromKeyboard(page);
        const button = optionsToolbar(page).getByRole('button', { name: 'Text Size' });
        await button.focus();

        await page.keyboard.press('Enter');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');

        await expect(page.getByRole('menu')).toHaveCount(0);
        await expect(button).toBeFocused();
    });

    test('An update that removes the focused annotation moves the focus to the next one', async ({ page }) => {
        await tabToAnnotations(page);

        const state = await getChartState(page);
        await setChartState(page, { ...state, annotations: [LINE_ANNOTATIONS[1]] as typeof state.annotations });

        await expect(annotationItems(page)).toHaveCount(1);
        await expect(annotationItems(page).first()).toBeFocused();
    });

    test('An update that removes an annotation after the focus left it leaves the focus alone', async ({ page }) => {
        await tabToAnnotations(page);
        await annotationItems(page).first().blur();

        const state = await getChartState(page);
        await setChartState(page, { ...state, annotations: [] });

        await expect(annotationItems(page)).toHaveCount(0);
        expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
    });

    for (const { name, select } of [
        {
            name: 'the keyboard',
            select: async (page: Page) => {
                await tabToAnnotations(page);
                await page.keyboard.press('ArrowDown');
                await page.keyboard.press('Enter');
            },
        },
        // The second line is at 60 on a 0 to 100 y axis.
        { name: 'a pointer', select: (page: Page) => clickSeriesArea(page, 0.4) },
    ]) {
        test(`marks the annotation selected with ${name} as current until it is deselected`, async ({ page }) => {
            await updateChart(page, { annotations: { optionsToolbar: { enabled: false } } });

            await select(page);

            await expect(annotationItems(page).first()).not.toHaveAttribute('aria-current');
            await expect(annotationItems(page).nth(1)).toHaveAttribute('aria-current', 'true');

            await clickSeriesArea(page, 0.1);

            await expect(annotationItems(page).nth(1)).not.toHaveAttribute('aria-current');
        });
    }

    for (const annotation of [
        { type: 'comment', text: 'Note', x: 30, y: 50 },
        { type: 'callout', text: 'Note', start: { x: 20, y: 20 }, end: { x: 30, y: 40 } },
        { type: 'arrow', start: { x: 20, y: 20 }, end: { x: 40, y: 40 } },
    ]) {
        test(`the focus box of a moving ${annotation.type} annotation moves with it at the same size`, async ({
            page,
        }) => {
            await setAnnotations(page, [annotation]);
            await startMove(page);
            const before = (await page.locator(':focus').boundingBox())!;

            for (let i = 0; i < 3; i++) {
                await page.keyboard.press('ArrowUp');
            }

            await expect.poll(async () => (await page.locator(':focus').boundingBox())!.y).toBeLessThan(before.y - 2);
            const after = (await page.locator(':focus').boundingBox())!;
            expect(after.x).toBeCloseTo(before.x, 0);
            expect(after.width).toBeCloseTo(before.width, 0);
            expect(after.height).toBeCloseTo(before.height, 0);
        });
    }

    test('focusing an annotation longer than the viewport outside it pans to its nearest end', async ({ page }) => {
        await updateChart(page, { zoom: { enabled: true } });
        const state = await getChartState(page);
        await setChartState(page, {
            ...state,
            zoom: { ratioX: { start: 0, end: 0.2 } },
            annotations: [
                { type: 'parallel-channel', start: { x: 50, y: 30 }, end: { x: 80, y: 60 }, height: 10 },
            ] as typeof state.annotations,
        });

        await tabToAnnotations(page);

        await expect(annotationItems(page).first()).toBeFocused();
        // The channel spans 0.5 to 0.8 of the x axis, so the viewport pans to show its start.
        await expect.poll(async () => (await getChartState(page)).zoom?.ratioX?.start).toBeCloseTo(0.5, 1);
        const { start = 0, end = 0 } = (await getChartState(page)).zoom?.ratioX ?? {};
        expect(end - start).toBeCloseTo(0.2);
    });

    test('annotations stay invisible under host button styles', async ({ page }) => {
        await page.addStyleTag({ content: 'button { color: rgb(0, 0, 0); text-shadow: 1px 1px rgb(0, 0, 0); }' });

        const style = await annotationItems(page)
            .first()
            .evaluate((el) => {
                const { color, textShadow } = getComputedStyle(el);
                return { color, textShadow };
            });

        expect(style).toEqual({ color: 'rgba(0, 0, 0, 0)', textShadow: 'none' });
    });

    test('Clicking an annotation still selects it without the Move Annotation button', async ({ page }) => {
        await clickFirstLine(page);

        await expect(optionsToolbar(page)).toBeVisible();
        await expect(optionsToolbar(page).getByRole('button', { name: 'Move Annotation' })).toHaveCount(0);

        await page.keyboard.press('ArrowUp');

        expect((await getHorizontalLineValues(page))[0]).toBeGreaterThan(30);
    });

    test.describe('with keyboardOnly buttons', () => {
        // Omits Move Annotation, which a keyboard user must still get.
        const buttons = [
            { icon: 'settings', tooltip: 'toolbarAnnotationsSettings', value: 'settings' },
            {
                type: 'switch',
                icon: 'unlocked',
                tooltip: 'toolbarAnnotationsLock',
                ariaLabel: 'toolbarAnnotationsLock',
                checkedOverrides: { icon: 'locked', tooltip: 'toolbarAnnotationsUnlock' },
                value: 'lock',
                keyboardOnly: true,
            },
            { icon: 'delete', tooltip: 'toolbarAnnotationsDelete', value: 'delete', keyboardOnly: true },
        ];

        test.beforeEach(async ({ page }) => {
            await page.evaluate(
                (optionsButtons) =>
                    (window as any).agE2E.chart.updateDelta({
                        annotations: { optionsToolbar: { buttons: optionsButtons } },
                    }),
                buttons
            );
            const state = await getChartState(page);
            await setChartState(page, { ...state, annotations: LINE_ANNOTATIONS as typeof state.annotations });
        });

        const keyboardOnlyItems = (page: Page) => [
            optionsToolbar(page).getByRole('switch', { name: 'Lock' }),
            optionsToolbar(page).getByRole('button', { name: 'Delete' }),
            optionsToolbar(page).getByRole('button', { name: 'Move Annotation' }),
        ];

        test('opening the toolbar with the keyboard shows them, and Move Annotation', async ({ page }) => {
            await tabToAnnotations(page);
            await page.keyboard.press('Enter');

            await expect(optionsToolbar(page).getByRole('button', { name: 'Settings' })).toBeVisible();
            for (const item of keyboardOnlyItems(page)) {
                await expect(item).toBeVisible();
            }
        });

        test('opening the toolbar with a pointer hides them', async ({ page }) => {
            const seriesArea = await page.locator('.ag-charts-series-area').boundingBox();
            await page.mouse.click(seriesArea!.x + seriesArea!.width / 2, seriesArea!.y + seriesArea!.height * 0.7);

            await expect(optionsToolbar(page).getByRole('button', { name: 'Settings' })).toBeVisible();
            for (const item of keyboardOnlyItems(page)) {
                await expect(item).toHaveCount(0);
            }
        });
    });
});
