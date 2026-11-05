import type { Locator, Page } from '@playwright/test';

import { getChartState } from './agE2E';
import { expect, test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
import { SELECTORS, canvasToPageTransformer, gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

// The fixture's axes both span 0 to 100, so a data value is a position as a percentage of the series area.
const THIRD = 100 / 3;
const TWO_THIRDS = 200 / 3;
const CENTRE = 50;

const MENU_ROW = '.ag-charts-menu__row';
// The series widget swaps between two elements; only the one currently exposed to assistive technology takes focus.
const SWAPCHAIN = '.ag-charts-swapchain[aria-hidden="false"]';
const TEXT_INPUT = '.ag-charts-text-input__textarea';

type ToolbarButtonTitle = 'Trend Lines' | 'Text Annotations' | 'Fibonacci' | 'Arrows' | 'Measurers';

interface ToolCase {
    menu: ToolbarButtonTitle;
    item: string;
    type: string;
    /** Numbers expected in the placed annotation's state, by dot-separated path. */
    expected: Record<string, number>;
    /** Text annotations open their text input instead of leaving focus on the chart. */
    opensTextInput: boolean;
    /** A key that moves the placed annotation, and the number that should increase when it does. */
    move?: { key: string; path: string };
}

const TOOLS: ToolCase[] = [
    {
        menu: 'Trend Lines',
        item: 'Trend Line',
        type: 'line',
        expected: { 'start.x': THIRD, 'start.y': THIRD, 'end.x': TWO_THIRDS, 'end.y': TWO_THIRDS },
        opensTextInput: false,
        move: { key: 'ArrowRight', path: 'start.x' },
    },
    {
        menu: 'Trend Lines',
        item: 'Horizontal Line',
        type: 'horizontal-line',
        expected: { value: CENTRE },
        opensTextInput: false,
        move: { key: 'ArrowUp', path: 'value' },
    },
    {
        menu: 'Trend Lines',
        item: 'Vertical Line',
        type: 'vertical-line',
        expected: { value: CENTRE },
        opensTextInput: false,
        move: { key: 'ArrowRight', path: 'value' },
    },
    {
        menu: 'Trend Lines',
        item: 'Parallel Channel',
        type: 'parallel-channel',
        expected: { 'start.x': THIRD, 'start.y': CENTRE, 'end.x': TWO_THIRDS, 'end.y': TWO_THIRDS },
        opensTextInput: false,
        move: { key: 'ArrowRight', path: 'start.x' },
    },
    {
        menu: 'Text Annotations',
        item: 'Text',
        type: 'text',
        expected: { x: CENTRE, y: CENTRE },
        opensTextInput: true,
    },
    {
        menu: 'Text Annotations',
        item: 'Callout',
        type: 'callout',
        expected: {},
        opensTextInput: true,
    },
    {
        menu: 'Trend Lines',
        item: 'Disjoint Channel',
        type: 'disjoint-channel',
        expected: {
            'start.x': THIRD,
            'start.y': CENTRE + THIRD / 4,
            'end.x': TWO_THIRDS,
            'end.y': TWO_THIRDS,
            startHeight: THIRD / 2,
            endHeight: THIRD,
        },
        opensTextInput: false,
    },
    {
        menu: 'Fibonacci',
        item: 'Fib Trend Based',
        type: 'fibonacci-retracement-trend-based',
        expected: {
            'start.x': THIRD,
            'start.y': THIRD,
            'end.x': CENTRE,
            'end.y': TWO_THIRDS,
            'endRetracement.x': TWO_THIRDS,
            'endRetracement.y': CENTRE,
        },
        opensTextInput: false,
    },
    {
        menu: 'Arrows',
        item: 'Arrow Up',
        type: 'arrow-up',
        expected: { x: CENTRE, y: CENTRE },
        opensTextInput: false,
    },
    {
        menu: 'Measurers',
        item: 'Price Range',
        type: 'price-range',
        expected: { 'start.y': THIRD, 'end.y': TWO_THIRDS },
        opensTextInput: false,
    },
];

const [TREND_LINE, HORIZONTAL_LINE, , , TEXT] = TOOLS;

type AnnotationState = Record<string, unknown>;

async function getAnnotations(page: Page): Promise<AnnotationState[]> {
    return ((await getChartState(page)).annotations ?? []) as AnnotationState[];
}

function numberAt(annotation: AnnotationState, path: string): number {
    const value = path
        .split('.')
        .reduce<unknown>((node, key) => (node as AnnotationState | undefined)?.[key], annotation);
    expect(typeof value, `${path} of ${JSON.stringify(annotation)}`).toBe('number');
    return value as number;
}

function chartArea(page: Page): Locator {
    return page.locator(SELECTORS.canvasCenter);
}

function menuButton(page: Page, { menu }: ToolCase): Locator {
    return page.getByTitle(menu);
}

/** Opens a toolbar menu and picks one of its items, using only the keyboard. */
async function chooseTool(page: Page, tool: ToolCase) {
    await menuButton(page, tool).focus();
    await page.keyboard.press('Enter');

    const itemIndex = (await page.locator(MENU_ROW).allTextContents()).indexOf(tool.item);
    expect(itemIndex, `menu item ${tool.item}`).toBeGreaterThanOrEqual(0);
    for (let i = 0; i < itemIndex; i++) {
        await page.keyboard.press('ArrowDown');
    }
    await expect(page.locator(MENU_ROW).nth(itemIndex)).toBeFocused();
    await page.keyboard.press('Enter');
}

test.describe('annotations keyboard create', () => {
    setupIntrinsicAssertions(test);

    const { url } = toExamplePageUrl('annotations-e2e', 'keyboard-create', 'vanilla');

    test.beforeEach(async ({ page }) => {
        await gotoExample(page, url);
    });

    for (const tool of TOOLS) {
        test(`Enter places a ${tool.type} annotation centred in the series area`, async ({ page }) => {
            await chooseTool(page, tool);

            // Choosing from the menu must leave focus on its toolbar button, not drop it to the body.
            await expect(menuButton(page, tool)).toBeFocused();
            expect(await getAnnotations(page)).toHaveLength(0);

            await page.keyboard.press('Enter');

            const annotations = await getAnnotations(page);
            expect(annotations).toHaveLength(1);
            expect(annotations[0].type).toBe(tool.type);
            for (const [path, expected] of Object.entries(tool.expected)) {
                expect(numberAt(annotations[0], path), path).toBeCloseTo(expected, 3);
            }

            await expect(page.locator(tool.opensTextInput ? TEXT_INPUT : SWAPCHAIN)).toBeFocused();
            await expect(page.locator(tool.opensTextInput ? TEXT_INPUT : SWAPCHAIN)).toHaveAccessibleName(tool.item);
            await expectChartScreenshot(page, chartArea(page), `annotations-keyboard-create-${tool.type}.png`);
        });
    }

    test('Enter places a callout about 20px across, unlike the third of the chart of other drawings', async ({
        page,
    }) => {
        const callout = TOOLS.find((tool) => tool.type === 'callout')!;
        await chooseTool(page, callout);
        await page.keyboard.press('Enter');

        const series = await page.locator('.ag-charts-series-area').boundingBox();
        const [annotation] = await getAnnotations(page);
        const width = ((numberAt(annotation, 'end.x') - numberAt(annotation, 'start.x')) * series!.width) / 100;
        const height = ((numberAt(annotation, 'end.y') - numberAt(annotation, 'start.y')) * series!.height) / 100;
        expect(width).toBeCloseTo(20, 0);
        expect(height).toBeCloseTo(20, 0);
        expect(numberAt(annotation, 'start.x') + numberAt(annotation, 'end.x')).toBeCloseTo(100, 3);
    });

    for (const tool of TOOLS.filter((t) => t.move)) {
        const { key, path } = tool.move!;
        test(`${key} moves the placed ${tool.type} annotation`, async ({ page }) => {
            await chooseTool(page, tool);
            await page.keyboard.press('Enter');

            const [before] = await getAnnotations(page);
            await page.keyboard.press(key);

            const annotations = await getAnnotations(page);
            expect(annotations).toHaveLength(1);
            expect(numberAt(annotations[0], path)).toBeGreaterThan(numberAt(before, path));
            await expectChartScreenshot(page, chartArea(page), `annotations-keyboard-create-${tool.type}-moved.png`);
        });
    }

    for (const tool of [TREND_LINE, TEXT]) {
        test(`Escape cancels a chosen ${tool.type} tool and returns focus to its button`, async ({ page }) => {
            await chooseTool(page, tool);
            await page.keyboard.press('Escape');

            await expect(menuButton(page, tool)).toBeFocused();
            expect(await getAnnotations(page)).toHaveLength(0);

            await page.keyboard.press('Enter');
            await expect(page.locator(MENU_ROW).first()).toBeVisible();
            expect(await getAnnotations(page)).toHaveLength(0);
        });
    }

    test('Enter on a tool button opens its menu again once the annotation is placed', async ({ page }) => {
        await chooseTool(page, TREND_LINE);
        await page.keyboard.press('Enter');
        expect(await getAnnotations(page)).toHaveLength(1);

        await menuButton(page, TREND_LINE).focus();
        await page.keyboard.press('Enter');

        await expect(page.locator(MENU_ROW).first()).toBeVisible();
        expect(await getAnnotations(page)).toHaveLength(1);
    });

    test('Enter on a tool button opens its menu once a click has started the drawing', async ({ page }) => {
        await chooseTool(page, TREND_LINE);

        const toPage = await canvasToPageTransformer(page);
        const { x, y } = toPage(300, 200);
        await page.mouse.click(x, y);

        await menuButton(page, TREND_LINE).focus();
        await page.keyboard.press('Enter');

        await expect(page.locator(MENU_ROW).first()).toBeVisible();
    });

    test('Escape on the chart cancels a chosen tool and returns focus to its button', async ({ page }) => {
        await chooseTool(page, TREND_LINE);
        await page.locator(SWAPCHAIN).focus();
        await page.keyboard.press('Escape');

        await expect(menuButton(page, TREND_LINE)).toBeFocused();
        expect(await getAnnotations(page)).toHaveLength(0);
    });

    test('Escape after dragging out a drawing does not move focus to Clear All', async ({ page }) => {
        await chooseTool(page, TREND_LINE);

        const toPage = await canvasToPageTransformer(page);
        const from = toPage(200, 300);
        const to = toPage(400, 150);
        await page.mouse.move(from.x, from.y);
        await page.mouse.down();
        await page.mouse.move(to.x, to.y, { steps: 5 });
        await page.mouse.up();
        await page.keyboard.press('Escape');

        await expect(page.getByTitle('Clear All')).not.toBeFocused();
    });

    test('Ctrl+Z and Ctrl+Y undo and redo each placed annotation in turn', async ({ page }) => {
        await chooseTool(page, HORIZONTAL_LINE);
        await page.keyboard.press('Enter');
        await chooseTool(page, TREND_LINE);
        await page.keyboard.press('Enter');
        expect((await getAnnotations(page)).map((a) => a.type)).toEqual(['horizontal-line', 'line']);

        await page.keyboard.press('Control+z');
        expect((await getAnnotations(page)).map((a) => a.type)).toEqual(['horizontal-line']);

        await page.keyboard.press('Control+z');
        expect(await getAnnotations(page)).toHaveLength(0);

        await page.keyboard.press('Control+y');
        expect((await getAnnotations(page)).map((a) => a.type)).toEqual(['horizontal-line']);
    });

    test('Enter on the chart places the chosen annotation once the chart is focused', async ({ page }) => {
        await chooseTool(page, TREND_LINE);
        await page.locator(SWAPCHAIN).focus();
        await page.keyboard.press('Enter');

        const annotations = await getAnnotations(page);
        expect(annotations).toHaveLength(1);
        expect(annotations[0].type).toBe('line');
        expect(numberAt(annotations[0], 'end.x')).toBeCloseTo(TWO_THIRDS, 3);
        await expect(page.locator(SWAPCHAIN)).toBeFocused();
        await expectChartScreenshot(page, chartArea(page), 'annotations-keyboard-create-line.png');
    });
});

test.describe('annotations keyboard create with directly configured buttons', () => {
    setupIntrinsicAssertions(test);

    const { url } = toExamplePageUrl('annotations-e2e', 'keyboard-create-buttons', 'vanilla');

    test.beforeEach(async ({ page }) => {
        await gotoExample(page, url);
    });

    test('Enter places the tool chosen last when tools are switched without a menu', async ({ page }) => {
        await page.getByTitle('Parallel Channel', { exact: true }).focus();
        await page.keyboard.press('Enter');
        await page.getByTitle('Text', { exact: true }).focus();
        await page.keyboard.press('Enter');
        await page.keyboard.press('Enter');

        const annotations = await getAnnotations(page);
        expect(annotations.map((a) => a.type)).toEqual(['text']);
        await expect(page.locator(TEXT_INPUT)).toBeFocused();
    });
});
