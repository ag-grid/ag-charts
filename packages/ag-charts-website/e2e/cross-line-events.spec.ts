import type { Page } from '@playwright/test';

import type { AgAxisDirection, AgAxisValue } from 'ag-charts-types';

import { evalPageFunction } from './agE2E';
import { expect, test } from './fixture';
import {
    SELECTORS,
    canvasToPageTransformer,
    gotoExample,
    setupIntrinsicAssertions,
    toExamplePageUrl,
    waitForChartUpdate,
} from './util';

type Level = 'crossLine' | 'axis' | 'chart';
type EventType = 'crossLineClick' | 'crossLineDoubleClick';
type CrossLineParams = {
    axisId: string;
    direction: AgAxisDirection;
    crossLineId: string;
    crossLineType: 'line' | 'range';
    value?: AgAxisValue;
    range?: [AgAxisValue, AgAxisValue];
};
type CanvasPoint = { x: number; y: number };

// The Cartesian chart is the reference behaviour; the polar chart must report the same events with the same
// params. Points are canvas coordinates found by scanning each example at the e2e viewport.
const CHARTS = [
    {
        name: 'cartesian',
        example: 'cross-line-click-event-cartesian',
        band: { axisId: 'x', direction: 'x', crossLineId: 'band', crossLineType: 'range', range: ['Q2', 'Q3'] },
        threshold: { axisId: 'y', direction: 'y', crossLineId: 'threshold', crossLineType: 'line', value: 5 },
        points: {
            band: { x: 400, y: 150 },
            threshold: { x: 105, y: 270 },
            both: { x: 400, y: 270 },
            miss: { x: 105, y: 150 },
        },
    },
    {
        name: 'polar',
        example: 'cross-line-click-event-polar',
        band: {
            axisId: 'angle',
            direction: 'angle',
            crossLineId: 'band',
            crossLineType: 'range',
            range: ['Q2', 'Q3'],
        },
        threshold: { axisId: 'radius', direction: 'radius', crossLineId: 'threshold', crossLineType: 'line', value: 5 },
        points: {
            band: { x: 560, y: 300 },
            threshold: { x: 255, y: 285 },
            both: { x: 515, y: 285 },
            miss: { x: 330, y: 285 },
        },
    },
] satisfies Array<{
    name: string;
    example: string;
    band: CrossLineParams;
    threshold: CrossLineParams;
    points: Record<'band' | 'threshold' | 'both' | 'miss', CanvasPoint>;
}>;

// Every matched cross line delivers the event to its own listener and its axis listener, then the chart hears it
// once with the first match as the root params.
function expectedEvents(type: EventType, hits: CrossLineParams[]) {
    const allMatchedParams = hits.map((hit) => ({ type, ...hit }));
    const at = (level: Level, params: CrossLineParams) => ({ level, type, ...params, allMatchedParams });
    return [...hits.map((hit) => at('crossLine', hit)), ...hits.map((hit) => at('axis', hit)), at('chart', hits[0])];
}

const CHART_CLICK = { level: 'chart', type: 'click' };

async function popEvents(page: Page): Promise<unknown> {
    await waitForChartUpdate(page.locator(SELECTORS.wrapper));
    return evalPageFunction(page, 'popEvents');
}

test.describe('cross-line-events', () => {
    setupIntrinsicAssertions(test);

    for (const chart of CHARTS) {
        test.describe(chart.name, () => {
            let toPage: (x: number, y: number) => CanvasPoint;

            test.beforeEach(async ({ page }) => {
                await gotoExample(page, toExamplePageUrl('events-e2e', chart.example, 'vanilla').url);
                toPage = await canvasToPageTransformer(page);
            });

            const cases = [
                { point: 'band', hits: [chart.band] },
                { point: 'threshold', hits: [chart.threshold] },
                { point: 'both', hits: [chart.band, chart.threshold] },
            ] as const;

            for (const { point, hits } of cases) {
                test.describe(point, () => {
                    test('click', async ({ page }) => {
                        const { x, y } = toPage(chart.points[point].x, chart.points[point].y);
                        await page.mouse.click(x, y);

                        expect(await popEvents(page)).toEqual(expectedEvents('crossLineClick', [...hits]));
                    });

                    test('double click', async ({ page }) => {
                        const { x, y } = toPage(chart.points[point].x, chart.points[point].y);
                        await page.mouse.dblclick(x, y);

                        const click = expectedEvents('crossLineClick', [...hits]);
                        const doubleClick = expectedEvents('crossLineDoubleClick', [...hits]);
                        expect(await popEvents(page)).toEqual([...click, ...click, ...doubleClick]);
                    });
                });
            }

            test('a click clear of every cross line reaches only the chart click listener', async ({ page }) => {
                const { x, y } = toPage(chart.points.miss.x, chart.points.miss.y);
                await page.mouse.click(x, y);
                expect(await popEvents(page)).toEqual([CHART_CLICK]);

                await page.mouse.dblclick(x, y);
                expect(await popEvents(page)).toEqual([CHART_CLICK, CHART_CLICK]);
            });
        });
    }
});
