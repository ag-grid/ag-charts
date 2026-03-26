import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';

import type { AgChartOptions, AgDonutSeriesOptions, AgPolarChartOptions } from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import { OptionsGraph } from '../../../module/optionsGraph';
import { Transformable } from '../../../scene/transformable';
import type { Chart } from '../../chart';
import type { AgChartProxy } from '../../chartProxy';
import { LegendMarkerLabel } from '../../legend/legendMarkerLabel';
import * as examples from '../../test/examples';
import { type MockDonutCalloutLineItemStyler, newFreezableMock } from '../../test/freezableMock';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    PATTERN_SNAPSHOT_DEFAULTS,
    clickAction,
    createChart,
    deproxy,
    doubleClickAction,
    doubleTapAction,
    expectWarningsCalls,
    extractImageData,
    hoverAction,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    tapAction,
    waitForChartStability,
} from '../../test/utils';
import { DonutSeries } from './donutSeries';

function* iterLegendMarkerLabels(myChart: Chart) {
    for (const { legend } of deproxy(myChart).modulesManager.legends()) {
        const markerLabels = (legend as any).itemSelection?._nodes as LegendMarkerLabel[];
        for (const label of markerLabels) {
            const { x, y } = Transformable.toCanvas(label).computeCenter();
            yield { x, y, text: label.text };
        }
    }
}

describe('DonutSeries', () => {
    setupMockConsole();

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const compare = async (customSnapshotIdentifier?: string, defaults = IMAGE_SNAPSHOT_DEFAULTS) => {
        await waitForChartStability(chart);
        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot({
            ...defaults,
            failureThreshold: 0,
            customSnapshotIdentifier,
        });
    };

    let chart: Chart;
    const ctx = setupMockCanvas();
    const options: AgPolarChartOptions = prepareTestOptions({});

    describe('#create', () => {
        test('multiple donuts', async () => {
            chart = await createChart({
                ...options,
                series: [
                    {
                        data: [
                            { city: 'Berlin', value: 150, index: 0 },
                            { city: 'Munich', value: 100, index: 1 },
                            { city: 'Hamburg', value: 180, index: 2 },
                            { city: 'London', value: 120, index: 3 },
                            { city: 'Manchester', value: 90, index: 4 },
                            { city: 'Birmingham', value: 160, index: 5 },
                            { city: 'Rome', value: 130, index: 6 },
                            { city: 'Milan', value: 80, index: 7 },
                            { city: 'Venice', value: 110, index: 8 },
                            { city: 'Singapore City', value: 110, index: 9 },
                            { city: 'Jurong', value: 120, index: 10 },
                            { city: 'Woodlands', value: 100, index: 11 },
                            { city: 'Delhi', value: 90, index: 12 },
                            { city: 'Mumbai', value: 70, index: 13 },
                            { city: 'Bangalore', value: 130, index: 14 },
                            { city: 'Tokyo', value: 120, index: 15 },
                            { city: 'Osaka', value: 100, index: 16 },
                            { city: 'Kyoto', value: 110, index: 17 },
                        ],
                        type: 'donut',
                        angleKey: 'value',
                        sectorLabelKey: 'city',
                        outerRadiusRatio: 0.8,
                        innerRadiusRatio: 0.6,
                    },
                    {
                        data: [
                            { country: 'Germany', value: 430, index: 0 },
                            { country: 'England', value: 370, index: 1 },
                            { country: 'Italy', value: 320, index: 2 },
                            { country: 'Singapore', value: 330, index: 3 },
                            { country: 'India', value: 290, index: 4 },
                            { country: 'Japan', value: 330, index: 5 },
                        ],
                        type: 'donut',
                        angleKey: 'value',
                        sectorLabelKey: 'country',
                        outerRadiusRatio: 0.6,
                        innerRadiusRatio: 0.4,
                    },
                    {
                        data: [
                            { continent: 'Europe', value: 1120 },
                            { continent: 'Asia', value: 950 },
                        ],
                        type: 'donut',
                        angleKey: 'value',
                        sectorLabelKey: 'continent',
                        outerRadiusRatio: 0.4,
                        innerRadiusRatio: 0.2,
                    },
                ],
            });
            await compare();
        });

        test('zerosum donut', async () => {
            chart = await createChart({
                ...options,
                data: [{ value: 0 }, { value: 0 }],
                series: [{ type: 'donut', angleKey: 'value', innerRadiusRatio: 0.5 }],
            });
            await compare();
        });

        test('one zerosum donut', async () => {
            chart = await createChart({
                ...options,
                data: [
                    { a: 0, b: 1 },
                    { a: 0, b: 3 },
                ],
                series: [
                    { type: 'donut', angleKey: 'a', outerRadiusRatio: 0.9, innerRadiusRatio: 0.7 },
                    { type: 'donut', angleKey: 'b', outerRadiusRatio: 0.4, innerRadiusRatio: 0.1 },
                ],
            });
            await compare();
        });

        test('two zerosum donuts', async () => {
            chart = await createChart({
                ...options,
                data: [
                    { a: 0, b: 0 },
                    { a: 0, b: 0 },
                ],
                series: [
                    { type: 'donut', angleKey: 'a', outerRadiusRatio: 0.9, innerRadiusRatio: 0.7 },
                    { type: 'donut', angleKey: 'b', outerRadiusRatio: 0.4, innerRadiusRatio: 0.1 },
                ],
            });
            await compare();
        });
    });

    describe('#validation', () => {
        test('null callout label key warning', async () => {
            chart = await createChart({
                ...options,
                data: [
                    { label: 'A', value: 10 },
                    { label: null, value: 20 },
                    { label: 'B', value: 15 },
                ],
                series: [{ type: 'donut', angleKey: 'value', calloutLabelKey: 'label', innerRadiusRatio: 0.5 }],
            });

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [DonutSeries-1 / calloutLabelKey] ignored:",
    "[null]",
  ],
  [
    "AG Charts - invalid value of type [object] for [DonutSeries-1 / calloutLabelValue] ignored:",
    "[null]",
  ],
]
`);
        });
    });

    describe('null category key', () => {
        it('should reject null category key with warning', async () => {
            const opts: AgChartOptions = examples.DONUT_NULL_ANGLE_KEY_EXAMPLE;
            prepareTestOptions(opts);

            chart = await createChart(opts);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [DonutSeries-1 / calloutLabelKey] ignored:",
    "[null]",
  ],
  [
    "AG Charts - invalid value of type [object] for [DonutSeries-1 / calloutLabelValue] ignored:",
    "[null]",
  ],
]
`);
            await compare();
        });

        it('should accept null category key when allowNullKeys is true', async () => {
            const opts: AgChartOptions = examples.DONUT_NULL_CATEGORY_KEY_ALLOWED_EXAMPLE;
            prepareTestOptions(opts);

            chart = await createChart(opts);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });

        it('should reject undefined category key with warning', async () => {
            const opts: AgChartOptions = examples.DONUT_UNDEFINED_CATEGORY_KEY_EXAMPLE;
            prepareTestOptions(opts);

            chart = await createChart(opts);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [undefined] for [DonutSeries-1 / calloutLabelKey] ignored:",
    "[undefined]",
  ],
  [
    "AG Charts - invalid value of type [undefined] for [DonutSeries-1 / calloutLabelValue] ignored:",
    "[undefined]",
  ],
]
`);
            await compare();
        });

        it('should accept undefined category key when allowNullKeys is true', async () => {
            const opts: AgChartOptions = examples.DONUT_UNDEFINED_CATEGORY_KEY_ALLOWED_EXAMPLE;
            prepareTestOptions(opts);

            chart = await createChart(opts);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });

        it('should treat null and undefined as distinct categories when allowNullKeys is true', async () => {
            const opts: AgChartOptions = examples.DONUT_NULL_AND_UNDEFINED_KEYS_EXAMPLE;
            prepareTestOptions(opts);

            chart = await createChart(opts);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - legend item '' has multiple fill colours, this may cause unexpected behaviour.",
  ],
]
`);
            await compare();
        });

        it('should call calloutLabel formatter with null value when allowNullKeys is true', async () => {
            const calloutLabelFormatter = jest.fn((params: any) =>
                params.value === null ? 'Unknown' : String(params.value)
            );
            const opts: AgChartOptions = {
                data: [
                    { asset: null, amount: 60000 },
                    { asset: 'Bonds', amount: 40000 },
                ],
                series: [
                    {
                        type: 'donut',
                        angleKey: 'amount',
                        calloutLabelKey: 'asset',
                        calloutLabel: { formatter: calloutLabelFormatter },
                        allowNullKeys: true,
                    } as any,
                ],
            };
            prepareTestOptions(opts);

            chart = await createChart(opts);

            expect(calloutLabelFormatter).toHaveBeenCalled();
            const callWithNull = calloutLabelFormatter.mock.calls.find((c: any[]) => c[0]?.value === null);
            expect(callWithNull).toBeDefined();
        });

        it('should render formatted callout label for null category when allowNullKeys is true', async () => {
            const opts: AgChartOptions = {
                data: [
                    { asset: null, amount: 60000 },
                    { asset: 'Bonds', amount: 40000 },
                ],
                series: [
                    {
                        type: 'donut',
                        angleKey: 'amount',
                        calloutLabelKey: 'asset',
                        calloutLabel: {
                            formatter: (params: any) => (params.value === null ? 'Unknown' : String(params.value)),
                        },
                        allowNullKeys: true,
                    } as any,
                ],
            };
            prepareTestOptions(opts);

            chart = await createChart(opts);

            await compare();
        });
    });

    describe('pattern fill', () => {
        it('should render donut series with pattern fills', async () => {
            chart = await createChart({
                ...options,
                data: [
                    { cat: 1, fox: 20, dog: 37 },
                    { cat: 3, fox: 10, dog: 32 },
                    { cat: 7, fox: 15, dog: 35 },
                    { cat: 8, fox: 17, dog: 36 },
                    { cat: 3, fox: 11, dog: 30 },
                ],
                series: [
                    {
                        type: 'donut',
                        radiusKey: 'dog',
                        angleKey: 'fox',
                        sectorLabelKey: 'fox',
                        innerRadiusRatio: 0.5,
                        fills: [
                            {
                                type: 'pattern',
                                pattern: 'hearts',
                                fill: 'red',
                                stroke: 'red',
                                backgroundFill: 'cyan',
                                backgroundFillOpacity: 0.6,
                                fillOpacity: 1,
                                strokeWidth: 1,
                                width: 60,
                                height: 60,
                            },
                            {
                                type: 'pattern',
                                pattern: 'stars',
                                fill: 'cyan',
                                stroke: 'blue',
                                backgroundFill: 'yellow',
                                backgroundFillOpacity: 0.6,
                                fillOpacity: 1,
                                strokeWidth: 1,
                                width: 20,
                                height: 20,
                            },
                            {
                                type: 'pattern',
                                pattern: 'circles',
                                fill: 'cyan',
                                stroke: 'blue',
                                backgroundFill: 'yellow',
                                backgroundFillOpacity: 0.6,
                                fillOpacity: 1,
                                strokeWidth: 2,
                                width: 50,
                                height: 50,
                            },
                            {
                                type: 'pattern',
                                fill: 'cyan',
                                stroke: 'blue',
                                backgroundFill: 'yellow',
                                backgroundFillOpacity: 0.6,
                                fillOpacity: 1,
                                strokeWidth: 2,
                                path: 'M 0 17.83 V 0 h 17.83 a 3 3 0 0 1 -5.66 2 H 5.9 A 5 5 0 0 1 2 5.9 v 6.27 a 3 3 0 0 1 -2 5.66 Z m 0 18.34 a 3 3 0 0 1 2 5.66 v 6.27 A 5 5 0 0 1 5.9 52 h 6.27 a 3 3 0 0 1 5.66 0 H 0 V 36.17 Z M 36.17 52 a 3 3 0 0 1 5.66 0 h 6.27 a 5 5 0 0 1 3.9 -3.9 v -6.27 a 3 3 0 0 1 0 -5.66 V 52 H 36.17 Z M 0 31.93 v -9.78 a 5 5 0 0 1 3.8 0.72 l 4.43 -4.43 a 3 3 0 1 1 1.42 1.41 L 5.2 24.28 a 5 5 0 0 1 0 5.52 l 4.44 4.43 a 3 3 0 1 1 -1.42 1.42 L 3.8 31.2 a 5 5 0 0 1 -3.8 0.72 Z m 52 -14.1 a 3 3 0 0 1 0 -5.66 V 5.9 A 5 5 0 0 1 48.1 2 h -6.27 a 3 3 0 0 1 -5.66 -2 H 52 v 17.83 Z m 0 14.1 a 4.97 4.97 0 0 1 -1.72 -0.72 l -4.43 4.44 a 3 3 0 1 1 -1.41 -1.42 l 4.43 -4.43 a 5 5 0 0 1 0 -5.52 l -4.43 -4.43 a 3 3 0 1 1 1.41 -1.41 l 4.43 4.43 c 0.53 -0.35 1.12 -0.6 1.72 -0.72 v 9.78 Z M 22.15 0 h 9.78 a 5 5 0 0 1 -0.72 3.8 l 4.44 4.43 a 3 3 0 1 1 -1.42 1.42 L 29.8 5.2 a 5 5 0 0 1 -5.52 0 l -4.43 4.44 a 3 3 0 1 1 -1.41 -1.42 l 4.43 -4.43 a 5 5 0 0 1 -0.72 -3.8 Z m 0 52 c 0.13 -0.6 0.37 -1.19 0.72 -1.72 l -4.43 -4.43 a 3 3 0 1 1 1.41 -1.41 l 4.43 4.43 a 5 5 0 0 1 5.52 0 l 4.43 -4.43 a 3 3 0 1 1 1.42 1.41 l -4.44 4.43 c 0.36 0.53 0.6 1.12 0.72 1.72 h -9.78 Z m 9.75 -24 a 5 5 0 0 1 -3.9 3.9 v 6.27 a 3 3 0 1 1 -2 0 V 31.9 a 5 5 0 0 1 -3.9 -3.9 h -6.27 a 3 3 0 1 1 0 -2 h 6.27 a 5 5 0 0 1 3.9 -3.9 v -6.27 a 3 3 0 1 1 2 0 v 6.27 a 5 5 0 0 1 3.9 3.9 h 6.27 a 3 3 0 1 1 0 2 H 31.9 Z',
                                width: 50,
                                height: 50,
                            },
                            {
                                type: 'pattern',
                                pattern: 'crosses',
                                fill: 'orange',
                                stroke: 'red',
                                backgroundFill: 'cyan',
                                backgroundFillOpacity: 0.6,
                                fillOpacity: 1,
                                strokeWidth: 1,
                                padding: 5,
                                width: 40,
                                height: 40,
                            },
                        ],
                    } as AgDonutSeriesOptions,
                ],
            });
            await compare(undefined, PATTERN_SNAPSHOT_DEFAULTS);
        });
    });

    describe('gradient fill', () => {
        it('should render donut series with a default radial gradient fill', async () => {
            chart = await createChart({
                ...options,
                data: [
                    { cat: 1, fox: 20, dog: 37 },
                    { cat: 3, fox: 10, dog: 32 },
                    { cat: 7, fox: 15, dog: 35 },
                    { cat: 8, fox: 17, dog: 36 },
                ],
                series: [
                    {
                        type: 'donut',
                        radiusKey: 'dog',
                        angleKey: 'fox',
                        sectorLabelKey: 'fox',
                        innerRadiusRatio: 0.5,
                        fills: [
                            {
                                type: 'gradient',
                            },
                        ],
                    },
                ],
            });
            await compare();
        });

        it('should render donut series with a radial gradient fill', async () => {
            chart = await createChart({
                ...options,
                data: [
                    { cat: 1, fox: 20, dog: 37 },
                    { cat: 3, fox: 10, dog: 32 },
                    { cat: 7, fox: 15, dog: 35 },
                    { cat: 8, fox: 17, dog: 36 },
                ],
                series: [
                    {
                        type: 'donut',
                        radiusKey: 'dog',
                        angleKey: 'fox',
                        sectorLabelKey: 'fox',
                        innerRadiusRatio: 0.5,
                        fills: [
                            {
                                type: 'gradient',
                                colorStops: [
                                    {
                                        color: 'green',
                                    },
                                    {
                                        color: 'white',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
            await compare();
        });

        it('should render donut series with a mix of radial gradient and string fills', async () => {
            chart = await createChart({
                ...options,
                data: [
                    { cat: 1, fox: 20, dog: 37 },
                    { cat: 3, fox: 10, dog: 32 },
                    { cat: 7, fox: 15, dog: 35 },
                    { cat: 8, fox: 17, dog: 36 },
                ],
                series: [
                    {
                        type: 'donut',
                        radiusKey: 'dog',
                        angleKey: 'fox',
                        sectorLabelKey: 'fox',
                        innerRadiusRatio: 0.5,
                        fills: [
                            {
                                type: 'gradient',
                                colorStops: [
                                    {
                                        color: 'green',
                                    },
                                    {
                                        color: 'white',
                                    },
                                ],
                            },
                            'blue',
                        ],
                    },
                ],
            });
            await compare();
        });

        it('should render donut series with a series bound radial gradient fill', async () => {
            chart = await createChart({
                ...options,
                data: [
                    { cat: 1, fox: 20, dog: 37 },
                    { cat: 3, fox: 10, dog: 32 },
                    { cat: 7, fox: 15, dog: 35 },
                    { cat: 8, fox: 17, dog: 36 },
                ],
                series: [
                    {
                        type: 'donut',
                        radiusKey: 'cat',
                        angleKey: 'fox',
                        sectorLabelKey: 'fox',
                        innerRadiusRatio: 0.1,
                        fills: [
                            {
                                type: 'gradient',
                                /* @ts-expect-error internal option */
                                bounds: 'series',
                                colorStops: [
                                    {
                                        color: 'green',
                                    },
                                    {
                                        color: 'white',
                                    },
                                ],
                            },
                        ],
                    } as AgDonutSeriesOptions,
                ],
            });
            await compare();
        });

        it('should render donut series with an item bound radial gradient fill', async () => {
            chart = await createChart({
                ...options,
                data: [
                    { cat: 1, fox: 20, dog: 37 },
                    { cat: 3, fox: 10, dog: 32 },
                    { cat: 7, fox: 15, dog: 35 },
                    { cat: 8, fox: 17, dog: 36 },
                ],
                series: [
                    {
                        type: 'donut',
                        radiusKey: 'cat',
                        angleKey: 'fox',
                        sectorLabelKey: 'fox',
                        innerRadiusRatio: 0.1,
                        fills: [
                            {
                                type: 'gradient',
                                /* @ts-expect-error internal option */
                                bounds: 'item',
                                colorStops: [
                                    {
                                        color: 'green',
                                    },
                                    {
                                        color: 'white',
                                    },
                                ],
                            },
                        ],
                    } as AgDonutSeriesOptions,
                ],
            });
            await compare();
        });

        it('should render donut series with an item bound linear gradient fill', async () => {
            chart = await createChart({
                ...options,
                data: [
                    { cat: 1, fox: 20, dog: 37 },
                    { cat: 3, fox: 10, dog: 32 },
                    { cat: 7, fox: 15, dog: 35 },
                    { cat: 8, fox: 17, dog: 36 },
                ],
                series: [
                    {
                        type: 'donut',
                        radiusKey: 'dog',
                        angleKey: 'fox',
                        sectorLabelKey: 'fox',
                        innerRadiusRatio: 0.5,
                        fills: [
                            {
                                type: 'gradient',
                                /* @ts-expect-error internal option */
                                gradient: 'linear',
                                bounds: 'item',
                                colorStops: [
                                    {
                                        color: 'green',
                                    },
                                    {
                                        color: 'white',
                                    },
                                ],
                            },
                        ],
                    } as AgDonutSeriesOptions,
                ],
            });
            await compare();
        });

        it('should render donut series with a series bound linear gradient fill', async () => {
            chart = await createChart({
                ...options,
                data: [
                    { cat: 1, fox: 20, dog: 37 },
                    { cat: 3, fox: 10, dog: 32 },
                    { cat: 7, fox: 15, dog: 35 },
                    { cat: 8, fox: 17, dog: 36 },
                ],
                series: [
                    {
                        type: 'donut',
                        radiusKey: 'dog',
                        angleKey: 'fox',
                        sectorLabelKey: 'fox',
                        innerRadiusRatio: 0.5,
                        fills: [
                            {
                                type: 'gradient',
                                /* @ts-expect-error internal option */
                                gradient: 'linear',
                                bounds: 'series',
                                colorStops: [
                                    {
                                        color: 'green',
                                    },
                                    {
                                        color: 'white',
                                    },
                                ],
                            },
                        ],
                    } as AgDonutSeriesOptions,
                ],
            });
            await compare();
        });
    });

    describe('#validation', () => {
        test('missing data warning', async () => {
            chart = await createChart({
                ...options,
                data: [{ cat: '1' }, { cat: '2' }, { fox: 'L' }, { cat: '4', dog: 10 }, { cat: '5', dog: 20 }],
                series: [
                    {
                        type: 'donut',
                        calloutLabelKey: 'cat',
                        angleKey: 'dog',
                        sectorLabelKey: 'fox',
                        innerRadiusRatio: 0.5,
                    },
                ],
            });

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [undefined] for [DonutSeries-1 / calloutLabelKey] ignored:",
    "[undefined]",
  ],
  [
    "AG Charts - no value was found for the key 'dog' on 3 data elements",
  ],
  [
    "AG Charts - no value was found for the key 'cat' on 1 data element",
  ],
  [
    "AG Charts - no value was found for the key 'fox' on 4 data elements",
  ],
]
`);
        });
    });

    describe('AG-14232 legend toggling', () => {
        beforeEach(async () => {
            chart = await createChart({
                data: [
                    { name: 'Froot-Loops', value: 3 },
                    { name: 'Cheerios', value: 4 },
                    { name: 'Weetos', value: 5 },
                ],
                series: [{ type: 'donut', angleKey: 'value', legendItemKey: 'name' }],
            });
        });
        describe('click', () => {
            test('mouse', async () => {
                for (const { x, y, text } of iterLegendMarkerLabels(chart)) {
                    await clickAction(x, y)(chart);
                    await compare(`donut-series-test-ts-pie-series-legend-click-${text}`);
                    await clickAction(x, y)(chart);
                }
            });
            test('touch', async () => {
                for (const { x, y, text } of iterLegendMarkerLabels(chart)) {
                    await tapAction(x, y)(chart);
                    await compare(`donut-series-test-ts-pie-series-legend-click-${text}`);
                    await tapAction(x, y)(chart);
                }
            });
        });
        describe('dblclick', () => {
            test('mouse', async () => {
                for (const { x, y } of iterLegendMarkerLabels(chart)) {
                    await doubleClickAction(x, y)(chart);
                    await compare(`donut-series-test-ts-pie-series-legend-All`);
                }
            });
            test('touch', async () => {
                for (const { x, y } of iterLegendMarkerLabels(chart)) {
                    await doubleTapAction(x, y)(chart);
                    await compare(`donut-series-test-ts-pie-series-legend-All`);
                }
            });
        });
    });

    describe('applyTransaction', () => {
        let chartProxy: AgChartProxy;
        let donutSeries: DonutSeries;

        beforeEach(async () => {
            OptionsGraph.clearValueCache();
            const transactionOptions = prepareTestOptions({
                theme: {
                    palette: {
                        fills: ['red', 'green'],
                        strokes: ['black'],
                    },
                },
                data: [
                    { city: 'Berlin', value: 5 },
                    { city: 'Munich', value: 3 },
                ],
                series: [
                    {
                        type: 'donut',
                        angleKey: 'value',
                        calloutLabelKey: 'city',
                        innerRadiusRatio: 0.5,
                    },
                ],
            });
            chartProxy = AgCharts.create(transactionOptions) as AgChartProxy;
            chart = deproxy(chartProxy);
            await waitForChartStability(chart);

            donutSeries = chart.series[0] as DonutSeries;
        });

        afterEach(() => {
            chartProxy = undefined!;
            donutSeries = undefined!;
        });

        test('reprocesses palette entries for new data', async () => {
            expect(donutSeries.properties.fills).toEqual(['red', 'green']);

            await chartProxy.applyTransaction({
                add: [
                    { city: 'Hamburg', value: 4 },
                    { city: 'Cologne', value: 2 },
                ],
            });
            await waitForChartStability(chart);

            expect(donutSeries.properties.fills).toEqual(['red', 'green', 'red', 'green']);
            const nodeData = donutSeries.getNodeData() ?? [];
            expect(nodeData).toHaveLength(4);
            expect(nodeData.map((datum) => datum.sectorFormat.fill)).toEqual(['red', 'green', 'red', 'green']);
        });

        test('removes data items correctly', async () => {
            const initialData = chartProxy.getOptions().data!;
            expect(initialData).toHaveLength(2);
            const initialNodeData = donutSeries.getNodeData() ?? [];
            expect(initialNodeData).toHaveLength(2);

            const itemToRemove = initialData[0];
            await chartProxy.applyTransaction({
                remove: [itemToRemove],
            });
            await waitForChartStability(chart);

            const updatedOptions = chartProxy.getOptions();
            expect(updatedOptions.data).toBeDefined();
            expect(updatedOptions.data!).toHaveLength(1);
            expect(updatedOptions.data!).not.toContainEqual(itemToRemove);

            const nodeData = donutSeries.getNodeData() ?? [];
            expect(nodeData).toHaveLength(1);
        });
    });

    // AG-8724 - Allow hiding zero value sectors in legend
    describe('hideZeroValueSectorsInLegend', () => {
        const data = [
            { id: 'a', value: 4 },
            { id: 'b', value: 0 },
            { id: 'c', value: 5 },
        ];
        const series: AgDonutSeriesOptions[] = [
            {
                type: 'donut',
                angleKey: 'value',
                calloutLabelKey: 'id',
                outerRadiusRatio: 0.8,
                innerRadiusRatio: 0.6,
            },
        ];
        const opts = prepareTestOptions({
            data,
            series,
        });

        it('should display legend item for zero value sectors when `hideZeroValueSectorsInLegend` is not supplied in the options', async () => {
            chart = await createChart(opts);
            await compare();
        });
        it('should hide legend item for zero value sectors when `hideZeroValueSectorsInLegend` is set to `true`', async () => {
            opts.series[0] = { ...series[0], hideZeroValueSectorsInLegend: true };

            chart = await createChart(opts);
            await compare();
        });
    });

    // AG-13953 - an invalid value shouldn't affect other segments or the legend
    describe('with invalid values', () => {
        it('should render correctly', async () => {
            const invalidDataOptions: AgPolarChartOptions = {
                data: [
                    { asset: 'Stocks', amount: 60000 },
                    { asset: 'Bonds', amount: 40000 },
                    { asset: 'Cash', amount: 7000 },
                    { asset: 'Real Estate', amount: null },
                    { asset: 'Commodities', amount: 3000 },
                ],
                title: {
                    text: 'Portfolio Composition',
                },
                series: [
                    {
                        type: 'donut',
                        angleKey: 'amount',
                        calloutLabelKey: 'asset',
                        sectorLabelKey: 'amount',
                        outerRadiusRatio: 0.8,
                        innerRadiusRatio: 0.6,
                    },
                ],
            };

            chart = await createChart(invalidDataOptions);
            await compare();

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [DonutSeries-1 / angleRaw] ignored:",
    "[null]",
  ],
  [
    "AG Charts - invalid value of type [object] for [DonutSeries-1 / sectorLabelValue] ignored:",
    "[null]",
  ],
]
`);
        });
    });

    test('AG-8290 label boxing', async () => {
        chart = await createChart({
            data: [
                { asset: 'Stocks', amount: 60000 },
                { asset: 'Bonds', amount: 40000 },
                { asset: 'Cash', amount: 7000 },
                { asset: 'Real Estate', amount: 5000 },
                { asset: 'Commodities', amount: 3000 },
            ],
            title: {
                text: 'Portfolio Composition',
            },
            series: [
                {
                    type: 'pie',
                    angleKey: 'amount',
                    calloutLabelKey: 'asset',
                    sectorLabelKey: 'amount',
                    sectorLabel: {
                        color: 'white',
                        fontWeight: 'bold',
                        padding: 5,
                        border: { strokeWidth: 3, stroke: 'lightblue' },
                        fill: 'lightgrey',
                        fillOpacity: 0.7,
                        cornerRadius: 10,
                    },
                    calloutLabel: {
                        color: 'green',
                        fontWeight: 'bold',
                        padding: 5,
                        border: { strokeWidth: 3, stroke: 'lightblue' },
                        fill: 'lightgrey',
                        fillOpacity: 0.7,
                        cornerRadius: 10,
                    },
                },
            ],
        });
        await compare();
    });

    describe('AG-11672 calloutLine.itemStyler', () => {
        type D = { name: string; size: number };
        type C = undefined;
        type M = MockDonutCalloutLineItemStyler<D, C>;
        let itemStyler: ReturnType<typeof newFreezableMock<D, C, M>>;
        beforeEach(async () => {
            itemStyler = newFreezableMock<D, C, M>((p) => {
                if (p.datum.name === 'Abu Dhabi') {
                    return { color: 'black' };
                }
                if (p.datum.name === 'Dublin') {
                    return { length: 100 };
                }
                if (p.datum.name === 'Paris') {
                    return { strokeWidth: 30 };
                }
                if (p.datum.name === 'Tokyo') {
                    return { strokeWidth: 15, color: '#00ff00' };
                }
                if (p.datum.name === 'Zurich') {
                    return { length: 125, strokeWidth: 20 };
                }
            });
            const opts: AgChartOptions<{ name: string; size: number }, undefined> = {
                data: [
                    { name: 'Abu Dhabi', size: 1 },
                    { name: 'Amsterdam', size: 1 },
                    { name: 'Barcelona', size: 1 },
                    { name: 'Berlin', size: 1 },
                    { name: 'Brussels', size: 1 },
                    { name: 'Cairo', size: 1 },
                    { name: 'Dublin', size: 1 },
                    { name: 'Hanoi', size: 1 },
                    { name: 'Kyiv', size: 1 },
                    { name: 'London', size: 1 },
                    { name: 'Madrid', size: 1 },
                    { name: 'New York', size: 1 },
                    { name: 'Paris', size: 1 },
                    { name: 'Rome', size: 1 },
                    { name: 'San Francisco', size: 1 },
                    { name: 'Tokyo', size: 1 },
                    { name: 'Zurich', size: 1 },
                ],
                series: [
                    {
                        type: 'donut',
                        angleKey: 'size',
                        calloutLabelKey: 'name',
                        calloutLine: {
                            colors: ['#9a1212', '#129a12', '#12129a'],
                            length: 50,
                            strokeWidth: 5,
                            itemStyler: itemStyler.frozen,
                        },
                    },
                ],
            };
            chart = await createChart(opts);
        });
        test('calls', () => {
            expect(itemStyler.mock.mock.calls).toMatchSnapshot();
        });
        test('image', async () => {
            await compare();
        });
    });

    describe('AG-16492 calloutLabel.itemStyler', () => {
        type D = { name: string; size: number };
        type C = undefined;
        type M = MockDonutCalloutLineItemStyler<D, C>;
        let itemStyler: ReturnType<typeof newFreezableMock<D, C, M>>;
        beforeEach(async () => {
            itemStyler = newFreezableMock<D, C, M>((p) => {
                if (p.datum.name === 'Abu Dhabi') {
                    return { border: { enabled: true, stroke: '#6E6E6E', strokeWidth: 1.25 } };
                }
                return { color: 'blue' };
            });
            const opts: AgChartOptions<{ name: string; size: number }, undefined> = {
                data: [
                    { name: 'Abu Dhabi', size: 1 },
                    { name: 'Amsterdam', size: 1 },
                    { name: 'Barcelona', size: 1 },
                    { name: 'Berlin', size: 1 },
                    { name: 'Brussels', size: 1 },
                    { name: 'Cairo', size: 1 },
                    { name: 'Dublin', size: 1 },
                    { name: 'Hanoi', size: 1 },
                    { name: 'Kyiv', size: 1 },
                    { name: 'London', size: 1 },
                    { name: 'Madrid', size: 1 },
                    { name: 'New York', size: 1 },
                    { name: 'Paris', size: 1 },
                    { name: 'Rome', size: 1 },
                    { name: 'San Francisco', size: 1 },
                    { name: 'Tokyo', size: 1 },
                    { name: 'Zurich', size: 1 },
                ],
                series: [
                    {
                        type: 'donut',
                        angleKey: 'size',
                        calloutLabelKey: 'name',
                        calloutLabel: {
                            itemStyler: itemStyler.frozen,
                        },
                    },
                ],
            };
            chart = await createChart(opts);
        });
        test('calls', () => {
            expect(itemStyler.mock.mock.calls).toMatchSnapshot();
        });
        test('image', async () => {
            await compare();
        });
    });

    describe('AG-16492 sectorLabel.itemStyler', () => {
        type D = { name: string; size: number };
        type C = undefined;
        type M = MockDonutCalloutLineItemStyler<D, C>;
        let itemStyler: ReturnType<typeof newFreezableMock<D, C, M>>;
        beforeEach(async () => {
            itemStyler = newFreezableMock<D, C, M>((p) => {
                if (p.datum.name === 'Abu Dhabi') {
                    return { border: { enabled: true, stroke: '#6E6E6E', strokeWidth: 1.25 } };
                }
                return { color: 'blue' };
            });
            const opts: AgChartOptions<{ name: string; size: number }, undefined> = {
                data: [
                    { name: 'Abu Dhabi', size: 1 },
                    { name: 'Amsterdam', size: 1 },
                    { name: 'Barcelona', size: 1 },
                    { name: 'Berlin', size: 1 },
                    { name: 'Brussels', size: 1 },
                ],
                series: [
                    {
                        type: 'donut',
                        angleKey: 'size',
                        sectorLabelKey: 'name',
                        calloutLabelKey: 'name',
                        sectorLabel: {
                            itemStyler: itemStyler.frozen,
                        },
                    },
                ],
            };
            chart = await createChart(opts);
        });
        test('calls', () => {
            expect(itemStyler.mock.mock.calls).toMatchSnapshot();
        });
        test('image', async () => {
            await compare();
        });
    });

    describe('cutout drawing mode', () => {
        it('should render donut series with cutout highlight drawing mode', async () => {
            const cutoutOptions: AgChartOptions = {
                data: [
                    { category: 'Q1', value: 25 },
                    { category: 'Q2', value: 30 },
                    { category: 'Q3', value: 20 },
                    { category: 'Q4', value: 25 },
                ],
                series: [
                    {
                        type: 'donut',
                        angleKey: 'value',
                        calloutLabelKey: 'category',
                        innerRadiusRatio: 0.5,
                        highlight: {
                            highlightedItem: {
                                fill: 'blue',
                                fillOpacity: 0.1,
                                stroke: 'black',
                                lineDash: [4, 2],
                            },
                        },
                    },
                ],
                highlight: {
                    drawingMode: 'cutout',
                },
            };

            chart = await createChart(cutoutOptions);

            await hoverAction(250, 200)(chart);
            await compare();
        });

        it('should render pie series with default highlight style cutout highlight drawing mode', async () => {
            const pieOptions: AgChartOptions = {
                data: [
                    { category: 'Q1', value: 25 },
                    { category: 'Q2', value: 30 },
                    { category: 'Q3', value: 20 },
                    { category: 'Q4', value: 25 },
                ],
                series: [
                    {
                        type: 'donut',
                        angleKey: 'value',
                        calloutLabelKey: 'category',
                        innerRadiusRatio: 0.5,
                    },
                ],
                highlight: {
                    drawingMode: 'cutout',
                },
            };

            chart = await createChart(pieOptions);

            await hoverAction(250, 200)(chart);
            await compare();
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });
});
