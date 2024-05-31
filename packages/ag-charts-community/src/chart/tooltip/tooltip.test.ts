import { describe, expect, it } from '@jest/globals';

import { AgCharts } from '../../api/agCharts';
import { type AgChartOptions } from '../../options/agChartOptions';
import { getDocument } from '../../util/dom';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    createChart,
    expectWarningsCalls,
    extractImageData,
    hoverAction,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';
import type { AgChartProxy, Chart } from '../test/utils';

describe('Tooltip', () => {
    setupMockConsole();
    let ctx: ReturnType<typeof setupMockCanvas>;
    let chart: AgChartProxy | Chart;

    afterEach(() => {
        chart?.destroy();
    });

    const compare = async () => {
        await waitForChartStability(chart);
        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    describe('Validation', () => {
        it('should show 1 warning for invalid tooltip value', async () => {
            await createChart({
                data: [
                    { month: 'Jun', sweaters: 50 },
                    { month: 'Jul', sweaters: 70 },
                    { month: 'Aug', sweaters: 60 },
                ],
                series: [{ type: 'line', xKey: 'month', yKey: 'sweaters', yName: 'Sweaters Made' }],
                tooltip: {
                    position: '2' as any,
                },
            });

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - unable to set TooltipPosition - expecting a properties object",
  ],
]
`);
        });

        it('should show 1 warning for invalid tooltip position value', async () => {
            await createChart({
                data: [
                    { month: 'Jun', sweaters: 50 },
                    { month: 'Jul', sweaters: 70 },
                    { month: 'Aug', sweaters: 60 },
                ],
                series: [{ type: 'line', xKey: 'month', yKey: 'sweaters', yName: 'Sweaters Made' }],
                tooltip: {
                    position: { type: 'ponter' as any, xOffset: 80, yOffset: 80 },
                },
            });

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - Property [type] of [TooltipPosition] cannot be set to ["ponter"]; expecting a position type keyword such as 'pointer', 'node', 'top', 'right', 'bottom', 'left', 'top-left', 'top-right', 'bottom-right' or 'bottom-left', ignoring.",
  ],
]
`);
        });
    });

    describe('Realtime', () => {
        it('should update tooltip correctly', async () => {
            // See AG-10409: The tooltip should update when the mouse stays in place but the data is updated.
            const opts: AgChartOptions = prepareTestOptions({});
            opts.data = [
                { time: 0, voltage: 1.362460821419385 },
                { time: 1, voltage: 1.3072694395877953 },
                { time: 2, voltage: 1.1967684308904354 },
                { time: 3, voltage: 1.2362572382997417 },
                { time: 4, voltage: 1.479504186572628 },
                { time: 5, voltage: 1.401144010767596 },
                { time: 6, voltage: 1.2192725536972913 },
                { time: 7, voltage: 1.1097886105628154 },
                { time: 8, voltage: 1.4869931693640273 },
                { time: 9, voltage: 1.1720928254975662 },
            ];
            opts.series = [{ type: 'line', xKey: 'time', yKey: 'voltage' }];

            chart = AgCharts.create(opts) as AgChartProxy;
            await waitForChartStability(chart);

            const nextValue = async (time: number, voltage: number) => {
                opts.data!.shift();
                opts.data!.push({ time, voltage });
                await (chart as AgChartProxy).update(opts);
                await waitForChartStability(chart);
            };

            await hoverAction(400, 300)(chart);
            await waitForChartStability(chart);

            const element = Array.from(getDocument('body').getElementsByClassName('ag-chart-tooltip'));
            expect(element.map((e) => e.textContent).join('')).toEqual('4.0: 1.48');

            await nextValue(10, 1.3249187570726666);
            expect(element.map((e) => e.textContent).join('')).toEqual('5.0: 1.40');

            await nextValue(11, 1.2651169069335022);
            expect(element.map((e) => e.textContent).join('')).toEqual('6.0: 1.22');

            await nextValue(12, 1.3627720015958902);
            expect(element.map((e) => e.textContent).join('')).toEqual('7.0: 1.11');

            await nextValue(13, 1.490244608234256);
            expect(element.map((e) => e.textContent).join('')).toEqual('8.0: 1.49');

            await nextValue(14, 1.490244608234256);
            expect(element.map((e) => e.textContent).join('')).toEqual('9.0: 1.17');
        });
    });

    describe('AG-11591 Range', () => {
        ctx = setupMockCanvas();

        const testHover = async (x: number, y: number) => {
            await hoverAction(x, y)(chart);
            await compare();
        };

        it('should use the same default behaviour as v9', async () => {
            chart = await createChart({
                data: [
                    { x: 'Q1', a: 22, b: 25, L: 3.4 },
                    { x: 'Q2', a: 18, b: 13, L: 4.0 },
                ],
                series: [
                    { type: 'bar', xKey: 'x', yKey: 'a' },
                    { type: 'bar', xKey: 'x', yKey: 'b' },
                    { type: 'line', xKey: 'x', yKey: 'L' },
                ],
                axes: [
                    { type: 'category', position: 'bottom' },
                    { type: 'number', position: 'left', keys: ['b', 'a'] },
                    { type: 'number', position: 'right', keys: ['L'] },
                ],
            });
            await testHover(221, 256); // highlight datum Q1 series L
            await testHover(666, 251); // highlight datum Q2 series L
            await testHover(152, 217); // highlight datum Q1 series a
            await testHover(659, 327); // highlight datum Q2 series b
        });

        it('should use chart tooltip.range as default', async () => {
            chart = await createChart({
                tooltip: { range: 20 },
                data: [{ x: 'Q1', a: 22 }],
                series: [{ type: 'bar', xKey: 'x', yKey: 'a' }],
            });
            await testHover(58, 28); // highlight nothing
            await testHover(137, 137); // highlight datum Q1 series b
        });

        it('should use series tooltip.range as default', async () => {
            chart = await createChart({
                data: [{ x: 'Q1', a: 22, b: 25 }],
                series: [
                    { type: 'bar', xKey: 'x', yKey: 'a' },
                    { type: 'bar', xKey: 'x', yKey: 'b', tooltip: { range: 'nearest' } },
                ],
            });
            await testHover(250, 250); // exact match on series a
            await testHover(100, 300); // nearest match on series b (even though series a is nearest)
        });

        it('should prefer series tooltip.range over chart tooltip.range', async () => {
            chart = await createChart({
                tooltip: { range: 'nearest' },
                data: [{ x: 'Q1', a: 22 }],
                series: [{ type: 'bar', xKey: 'x', yKey: 'a', tooltip: { range: 20 } }],
            });
            await testHover(58, 28); // no highlight match
            await testHover(137, 137); // match within range <= 20
        });
    });
});
