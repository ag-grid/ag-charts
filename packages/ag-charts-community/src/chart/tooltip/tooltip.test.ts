import { describe, expect, it } from '@jest/globals';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

import type { AgChartOptions } from '../../options/agChartOptions';
import { AgCharts } from '../agChartV2';
import type { Chart } from '../chart';
import { expectWarning, setupMockConsole } from '../test/mockConsole';
import { AgChartProxy, createChart, hoverAction, prepareTestOptions, waitForChartStability } from '../test/utils';

expect.extend({ toMatchImageSnapshot });

describe('Tooltip', () => {
    setupMockConsole();

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

            expectWarning(
                `AG Charts - unable to set [tooltip.position] in Tooltip - can't apply type of [primitive], allowed types are: [class-instance]`
            );
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

            expectWarning(
                `AG Charts - Property [type] of [TooltipPosition] cannot be set to ["ponter"]; expecting a position type keyword such as 'pointer', 'node', 'top', 'right', 'bottom', 'left', 'top-left', 'top-right', 'bottom-right' or 'bottom-left', ignoring.`
            );
        });
    });

    describe('Realtime', () => {
        let chart: AgChartProxy;
        afterEach(() => {
            chart?.destroy();
        });

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
                AgCharts.update(chart, opts);
                await waitForChartStability(chart);
            };

            await hoverAction(400, 300)(chart);
            await waitForChartStability(chart);
            expect(document.body.getElementsByClassName('ag-chart-tooltip')).toMatchSnapshot();

            await nextValue(10, 1.3249187570726666);
            expect(document.body.getElementsByClassName('ag-chart-tooltip')).toMatchSnapshot();

            await nextValue(11, 1.2651169069335022);
            expect(document.body.getElementsByClassName('ag-chart-tooltip')).toMatchSnapshot();

            await nextValue(12, 1.3627720015958902);
            expect(document.body.getElementsByClassName('ag-chart-tooltip')).toMatchSnapshot();

            await nextValue(13, 1.490244608234256);
            expect(document.body.getElementsByClassName('ag-chart-tooltip')).toMatchSnapshot();

            await nextValue(14, 1.490244608234256);
            expect(document.body.getElementsByClassName('ag-chart-tooltip')).toMatchSnapshot();
        });
    });
});
