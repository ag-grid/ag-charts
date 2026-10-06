import type { Locator, Page } from '@playwright/test';

import { expect, test } from './fixture';
import { gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

const TOLERANCE = 1;

async function box(locator: Locator) {
    const bbox = await locator.boundingBox();
    if (bbox == null) throw new Error('Expected element to have a bounding box');
    return bbox;
}

function expectSize(bbox: { width: number; height: number }, width: number | undefined, height: number) {
    if (width != null) expect(Math.abs(bbox.width - width)).toBeLessThanOrEqual(TOLERANCE);
    expect(Math.abs(bbox.height - height)).toBeLessThanOrEqual(TOLERANCE);
}

type Box = { x: number; y: number; width: number; height: number };

function contains(outer: Box, inner: Box) {
    return (
        inner.x >= outer.x - TOLERANCE &&
        inner.y >= outer.y - TOLERANCE &&
        inner.x + inner.width <= outer.x + outer.width + TOLERANCE &&
        inner.y + inner.height <= outer.y + outer.height + TOLERANCE
    );
}

function intersects(a: Box, b: Box) {
    return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

async function hitsButtonAt(page: Page, button: Locator, x: number, y: number) {
    const handle = await button.elementHandle();
    return page.evaluate(([el, px, py]) => document.elementFromPoint(px, py)?.closest('button') === el, [
        handle,
        x,
        y,
    ] as const);
}

test.describe('toolbar button size', () => {
    setupIntrinsicAssertions(test);

    const { url } = toExamplePageUrl('financial-charts-toolbar', 'toolbar-button-size', 'vanilla');

    test('each toolbar uses its own size', async ({ page }) => {
        await gotoExample(page, url);

        const sharedButtons = page.locator('.ag-charts-shared-toolbar .ag-charts-toolbar__button');
        const count = await sharedButtons.count();
        expect(count).toBeGreaterThan(1);

        expectSize(await box(sharedButtons.first()), undefined, 40);
        for (let i = 1; i < count; i++) {
            expectSize(await box(sharedButtons.nth(i)), 44, 44);
        }

        const zoomButtons = page.locator('.ag-charts-zoom-buttons .ag-charts-toolbar__button');
        const zoomContainer = await box(page.locator('.ag-charts-zoom-buttons'));
        expect(await zoomButtons.count()).toBeGreaterThan(0);
        for (const button of await zoomButtons.all()) {
            const bbox = await box(button);
            expectSize(bbox, 36, 36);
            expect(contains(zoomContainer, bbox)).toBe(true);
        }

        const rangeButtons = page.locator('.ag-charts-range-buttons--buttons .ag-charts-toolbar__button');
        expect(await rangeButtons.count()).toBeGreaterThan(0);
        for (const button of await rangeButtons.all()) {
            const bbox = await box(button);
            expectSize(bbox, undefined, 48);
            expect(bbox.width).toBeGreaterThanOrEqual(48 - TOLERANCE);
        }
    });

    test('hit area matches the rendered button and toolbars do not overlap', async ({ page }) => {
        await gotoExample(page, url);

        const sharedButtons = page.locator('.ag-charts-shared-toolbar .ag-charts-toolbar__button');
        const target = sharedButtons.nth(1);
        const bbox = await box(target);
        const inset = 2;
        const corners = [
            [bbox.x + inset, bbox.y + inset],
            [bbox.x + bbox.width - inset, bbox.y + inset],
            [bbox.x + inset, bbox.y + bbox.height - inset],
            [bbox.x + bbox.width - inset, bbox.y + bbox.height - inset],
        ];
        for (const [x, y] of corners) {
            expect(await hitsButtonAt(page, target, x, y)).toBe(true);
        }

        const sharedToolbar = await box(page.locator('.ag-charts-shared-toolbar'));
        const rangeToolbar = await box(page.locator('.ag-charts-range-buttons--buttons'));
        expect(intersects(sharedToolbar, rangeToolbar)).toBe(false);
    });
});
