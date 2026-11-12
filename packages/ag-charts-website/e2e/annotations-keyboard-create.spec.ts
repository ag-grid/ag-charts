import type { Locator, Page } from '@playwright/test';

import { getChartState } from './agE2E';
import { expect, test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

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

const toolOf = (type: string) => TOOLS.find((tool) => tool.type === type)!;
const TREND_LINE = toolOf('line');
const HORIZONTAL_LINE = toolOf('horizontal-line');

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
async function chooseTool(page: Page, tool: ToolCase, pickKey: 'Enter' | 'Space' = 'Enter') {
    await menuButton(page, tool).focus();
    await page.keyboard.press('Enter');

    const itemIndex = (await page.locator(MENU_ROW).allTextContents()).indexOf(tool.item);
    expect(itemIndex, `menu item ${tool.item}`).toBeGreaterThanOrEqual(0);
    for (let i = 0; i < itemIndex; i++) {
        await page.keyboard.press('ArrowDown');
    }
    await expect(page.locator(MENU_ROW).nth(itemIndex)).toBeFocused();
    await page.keyboard.press(pickKey);
}

test.describe('annotations keyboard create', () => {
    setupIntrinsicAssertions(test);

    const { url } = toExamplePageUrl('annotations-e2e', 'keyboard-create', 'vanilla');

    test.beforeEach(async ({ page }) => {
        await gotoExample(page, url);
    });

    for (const tool of TOOLS) {
        test(`Choosing ${tool.type} from its menu creates it centred in the series area`, async ({ page }) => {
            await chooseTool(page, tool);

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

    test('Choosing a tool with Space creates it too', async ({ page }) => {
        await chooseTool(page, TREND_LINE, 'Space');

        expect((await getAnnotations(page)).map((a) => a.type)).toEqual(['line']);
        await expect(page.locator(SWAPCHAIN)).toBeFocused();
    });

    test('The tool button is no longer highlighted once the annotation is created', async ({ page }) => {
        await chooseTool(page, TREND_LINE);

        await expect(menuButton(page, TREND_LINE)).not.toHaveClass(/ag-charts-toolbar__button--active/);
    });

    test('Choosing a callout creates one about 20px across, unlike the third of the chart of other drawings', async ({
        page,
    }) => {
        await chooseTool(page, toolOf('callout'));

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
        test(`${key} moves the created ${tool.type} annotation`, async ({ page }) => {
            await chooseTool(page, tool);

            const [before] = await getAnnotations(page);
            await page.keyboard.press(key);

            const annotations = await getAnnotations(page);
            expect(annotations).toHaveLength(1);
            expect(numberAt(annotations[0], path)).toBeGreaterThan(numberAt(before, path));
            await expectChartScreenshot(page, chartArea(page), `annotations-keyboard-create-${tool.type}-moved.png`);
        });
    }

    test('Choosing a tool with the mouse waits for the drawing instead of creating it', async ({ page }) => {
        await menuButton(page, TREND_LINE).click();
        await page.locator(MENU_ROW).filter({ hasText: TREND_LINE.item }).click();

        expect(await getAnnotations(page)).toHaveLength(0);
        await expect(menuButton(page, TREND_LINE)).toHaveClass(/ag-charts-toolbar__button--active/);
    });

    test('Ctrl+Z and Ctrl+Y undo and redo each created annotation in turn', async ({ page }) => {
        await chooseTool(page, HORIZONTAL_LINE);
        await chooseTool(page, TREND_LINE);
        expect((await getAnnotations(page)).map((a) => a.type)).toEqual(['horizontal-line', 'line']);

        await page.keyboard.press('Control+z');
        expect((await getAnnotations(page)).map((a) => a.type)).toEqual(['horizontal-line']);

        await page.keyboard.press('Control+z');
        expect(await getAnnotations(page)).toHaveLength(0);

        await page.keyboard.press('Control+y');
        expect((await getAnnotations(page)).map((a) => a.type)).toEqual(['horizontal-line']);
    });
});

test.describe('annotations keyboard create with directly configured buttons', () => {
    setupIntrinsicAssertions(test);

    const { url } = toExamplePageUrl('annotations-e2e', 'keyboard-create-buttons', 'vanilla');

    test.beforeEach(async ({ page }) => {
        await gotoExample(page, url);
    });

    test('Enter on one tool button after another creates each annotation', async ({ page }) => {
        await page.getByTitle('Parallel Channel', { exact: true }).focus();
        await page.keyboard.press('Enter');
        await page.getByTitle('Text', { exact: true }).focus();
        await page.keyboard.press('Enter');

        const annotations = await getAnnotations(page);
        expect(annotations.map((a) => a.type)).toEqual(['parallel-channel', 'text']);
        await expect(page.locator(TEXT_INPUT)).toBeFocused();
    });
});
