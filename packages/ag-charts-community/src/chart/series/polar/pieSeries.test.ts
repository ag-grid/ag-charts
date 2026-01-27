import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';

import type { AgChartOptions, AgPieSeriesOptions, AgPolarChartOptions } from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import { OptionsGraph } from '../../../module/optionsGraph';
import { Transformable } from '../../../scene/transformable';
import type { Chart } from '../../chart';
import type { AgChartProxy } from '../../chartProxy';
import { LegendMarkerLabel } from '../../legend/legendMarkerLabel';
import * as examples from '../../test/examples';
import { type MockPieCalloutLineItemStyler, newFreezableMock } from '../../test/freezableMock';
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
    looserSnapshotDefaults,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    tapAction,
    waitForChartStability,
} from '../../test/utils';
import { PieSeries } from './pieSeries';

function* iterPieSectors(myChart: Chart) {
    const pieSeries = deproxy(myChart).series[0] as PieSeries;
    for (const nodeData of pieSeries.getNodeData() ?? []) {
        if (nodeData.angleValue < 1e-10) continue;

        const { x = 0, y = 0 } = nodeData.midPoint ?? {};
        yield Transformable.toCanvasPoint(pieSeries.contentGroup, x, y);
    }
}

function* iterLegendMarkerLabels(myChart: Chart) {
    for (const { legend } of deproxy(myChart).modulesManager.legends()) {
        const markerLabels = (legend as any).itemSelection?._nodes as LegendMarkerLabel[];
        for (const label of markerLabels) {
            const { x, y } = Transformable.toCanvas(label).computeCenter();
            yield { x, y, text: label.text };
        }
    }
}

describe('PieSeries', () => {
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
        test('zerosum pie', async () => {
            chart = await createChart({
                ...options,
                data: [{ value: 0 }, { value: 0 }],
                series: [{ type: 'pie', angleKey: 'value' }],
            });
            await compare();
        });
    });

    describe('#validation', () => {
        test('missing data warning', async () => {
            chart = await createChart({
                ...options,
                data: [{ cat: '1' }, { cat: '2' }, { fox: 'L' }, { cat: '4', dog: 10 }, { cat: '5', dog: 20 }],
                series: [{ type: 'pie', calloutLabelKey: 'cat', angleKey: 'dog', sectorLabelKey: 'fox' }],
            });

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [undefined] for [PieSeries-1 / calloutLabelKey] ignored:",
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

        test('null callout label key warning', async () => {
            chart = await createChart({
                ...options,
                data: [
                    { label: 'A', value: 10 },
                    { label: null, value: 20 },
                    { label: 'B', value: 15 },
                ],
                series: [{ type: 'pie', angleKey: 'value', calloutLabelKey: 'label' }],
            });

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [PieSeries-1 / calloutLabelKey] ignored:",
    "[null]",
  ],
  [
    "AG Charts - invalid value of type [object] for [PieSeries-1 / calloutLabelValue] ignored:",
    "[null]",
  ],
]
`);
        });
    });

    describe('null category key', () => {
        it('should reject null category key with warning', async () => {
            const opts: AgChartOptions = examples.PIE_NULL_ANGLE_KEY_EXAMPLE;
            prepareTestOptions(opts);

            chart = await createChart(opts);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [PieSeries-1 / calloutLabelKey] ignored:",
    "[null]",
  ],
  [
    "AG Charts - invalid value of type [object] for [PieSeries-1 / calloutLabelValue] ignored:",
    "[null]",
  ],
]
`);
            await compare();
        });

        it('should accept null category key when allowNullKeys is true', async () => {
            const opts: AgChartOptions = examples.PIE_NULL_CATEGORY_KEY_ALLOWED_EXAMPLE;
            prepareTestOptions(opts);

            chart = await createChart(opts);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
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
                        type: 'pie',
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
                        type: 'pie',
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
        it('should render pie series with default pattern fills', async () => {
            chart = await createChart({
                ...options,
                data: [
                    { cat: 1, fox: 20, dog: 37 },
                    { cat: 3, fox: 10, dog: 32 },
                    { cat: 7, fox: 15, dog: 35 },
                    { cat: 8, fox: 20, dog: 31 },
                    { cat: 3, fox: 11, dog: 30 },
                ],
                series: [
                    {
                        type: 'pie',
                        radiusKey: 'dog',
                        angleKey: 'fox',
                        sectorLabelKey: 'fox',
                        fills: [{ type: 'pattern' }, { type: 'pattern' }, { type: 'pattern' }, { type: 'pattern' }],
                    },
                ],
            });
            await compare(undefined, PATTERN_SNAPSHOT_DEFAULTS);
        });

        it('should render pie series with pattern fills', async () => {
            chart = await createChart({
                ...options,
                data: [
                    { cat: 1, fox: 20, dog: 37 },
                    { cat: 3, fox: 10, dog: 32 },
                    { cat: 7, fox: 15, dog: 35 },
                    { cat: 8, fox: 20, dog: 31 },
                    { cat: 3, fox: 11, dog: 30 },
                ],
                series: [
                    {
                        type: 'pie',
                        radiusKey: 'dog',
                        angleKey: 'fox',
                        sectorLabelKey: 'fox',
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
                    } as AgPieSeriesOptions,
                ],
            });
            await compare(undefined, looserSnapshotDefaults(0.08));
        });
    });

    describe('gradient fill', () => {
        it('should render pie series with a default radial gradient fill', async () => {
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
                        type: 'pie',
                        radiusKey: 'dog',
                        angleKey: 'fox',
                        sectorLabelKey: 'fox',
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

        it('should render pie series with a radial gradient fill', async () => {
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
                        type: 'pie',
                        radiusKey: 'dog',
                        angleKey: 'fox',
                        sectorLabelKey: 'fox',
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

        it('should render pie series with a mix of radial gradient and string fills', async () => {
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
                        type: 'pie',
                        radiusKey: 'dog',
                        angleKey: 'fox',
                        sectorLabelKey: 'fox',
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

        it('should render pie series with an item bound linear gradient fill', async () => {
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
                        type: 'pie',
                        radiusKey: 'dog',
                        angleKey: 'fox',
                        sectorLabelKey: 'fox',
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
                    } as AgPieSeriesOptions,
                ],
            });
            await compare();
        });

        it('should render pie series with a series bound linear gradient fill', async () => {
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
                        type: 'pie',
                        radiusKey: 'dog',
                        angleKey: 'fox',
                        sectorLabelKey: 'fox',
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
                    } as AgPieSeriesOptions,
                ],
            });
            await compare();
        });

        it('should render pie series with a series bound radial gradient fill', async () => {
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
                        type: 'pie',
                        angleKey: 'fox',
                        radiusKey: 'cat',
                        sectorLabelKey: 'fox',
                        fills: [
                            {
                                type: 'gradient',
                                /* @ts-expect-error internal option */
                                gradient: 'radial',
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
                    } as AgPieSeriesOptions,
                ],
            });
            await compare();
        });

        it('should render pie series with an item bound radial gradient fill', async () => {
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
                        type: 'pie',
                        angleKey: 'fox',
                        radiusKey: 'cat',
                        sectorLabelKey: 'fox',
                        fills: [
                            {
                                type: 'gradient',
                                /* @ts-expect-error internal option */
                                gradient: 'radial',
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
                    } as AgPieSeriesOptions,
                ],
            });
            await compare();
        });
    });

    describe('itemStyler', () => {
        it('complex fills', async () => {
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
                        type: 'pie',
                        radiusKey: 'dog',
                        angleKey: 'fox',
                        sectorLabelKey: 'fox',
                        itemStyler: (params) => {
                            if (params.datum.fox === 20) return { fill: { type: 'gradient' } };
                            if (params.datum.fox === 10) return { fill: { type: 'pattern' } };
                            if (params.datum.fox === 15) return { fill: { type: 'pattern', pattern: 'squares' } };
                            if (params.datum.fox === 17) {
                                return {
                                    fill: { type: 'gradient', colorStops: [{ color: 'red' }, { color: 'blue' }] },
                                };
                            }
                        },
                    },
                ],
            });
            await compare();
        });

        it('complex fills over default fill', async () => {
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
                        type: 'pie',
                        radiusKey: 'dog',
                        angleKey: 'fox',
                        sectorLabelKey: 'fox',
                        fills: ['red'],
                        itemStyler: (params) => {
                            if (params.datum.fox === 20) return { fill: { type: 'gradient' } };
                            if (params.datum.fox === 10) return { fill: { type: 'pattern' } };
                            if (params.datum.fox === 15) return { fill: { type: 'pattern', pattern: 'squares' } };
                            if (params.datum.fox === 17) {
                                return {
                                    fill: { type: 'gradient', colorStops: [{ color: 'red' }, { color: 'blue' }] },
                                };
                            }
                        },
                    },
                ],
            });
            await compare();
        });

        it('complex fills over default gradient', async () => {
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
                        type: 'pie',
                        radiusKey: 'dog',
                        angleKey: 'fox',
                        sectorLabelKey: 'fox',
                        fills: [{ type: 'gradient' }],
                        itemStyler: (params) => {
                            if (params.datum.fox === 20) return { fill: { type: 'gradient' } };
                            if (params.datum.fox === 10) return { fill: { type: 'pattern' } };
                            if (params.datum.fox === 15) return { fill: { type: 'pattern', pattern: 'squares' } };
                            if (params.datum.fox === 17) {
                                return {
                                    fill: { type: 'gradient', colorStops: [{ color: 'pink' }, { color: 'orange' }] },
                                };
                            }
                        },
                    },
                ],
            });
            await compare();
        });
    });

    describe('nodeClick', () => {
        const clicks: string[] = [];
        const doubleClicks: string[] = [];
        const legendClicks: string[] = [];

        const nodeClickOptions: AgPolarChartOptions = {
            data: [
                { asset: 'Stocks', amount: 5 },
                { asset: 'Cash', amount: 5 },
                { asset: 'Bonds', amount: 0 }, // AG-12321 - nodeClick not triggered for datums after a zero value.
                { asset: 'Real Estate', amount: 5 },
                { asset: 'Commodities', amount: 5 },
            ],
            series: [
                {
                    type: 'pie',
                    angleKey: 'amount',
                    legendItemKey: 'asset',
                    listeners: {
                        seriesNodeClick: (event) => {
                            clicks.push(event.datum.asset);
                        },
                        seriesNodeDoubleClick: (event) => {
                            doubleClicks.push(event.datum.asset);
                        },
                    },
                },
            ],
            legend: {
                listeners: {
                    legendItemClick: (event) => {
                        legendClicks.push(event.itemId);
                    },
                },
            },
        };

        beforeEach(async () => {
            chart = await createChart(nodeClickOptions);
            clicks.splice(0, clicks.length);
            doubleClicks.splice(0, doubleClicks.length);
            legendClicks.splice(0, legendClicks.length);
        });

        describe('should fire a nodeClick event for each visible sector', () => {
            test('mouse', async () => {
                for (const { x, y } of iterPieSectors(chart)) {
                    await waitForChartStability(chart);
                    await clickAction(x, y)(chart);
                }
            });
            test('touch', async () => {
                for (const { x, y } of iterPieSectors(chart)) {
                    await waitForChartStability(chart);
                    await tapAction(x, y)(chart);
                }
            });

            afterEach(() => {
                expect(clicks).toEqual(['Stocks', 'Cash', 'Real Estate', 'Commodities']);
                expect(doubleClicks).toHaveLength(0);
                expect(legendClicks).toHaveLength(0);
            });
        });

        describe('should fire a nodeDoubleClick event for each visible sector', () => {
            test('mouse', async () => {
                for (const { x, y } of iterPieSectors(chart)) {
                    await waitForChartStability(chart);
                    await doubleClickAction(x, y)(chart);
                }
            });
            test('touch', async () => {
                for (const { x, y } of iterPieSectors(chart)) {
                    await waitForChartStability(chart);
                    await doubleTapAction(x, y)(chart);
                }
            });

            afterEach(() => {
                expect(doubleClicks).toEqual(['Stocks', 'Cash', 'Real Estate', 'Commodities']);
                expect(clicks).toHaveLength(8);
                expect(legendClicks).toHaveLength(0);
            });
        });

        describe('should not fire series events for legend clicks', () => {
            test('mouse', async () => {
                for (const { x, y } of iterLegendMarkerLabels(chart)) {
                    await clickAction(x, y)(chart);
                    await waitForChartStability(chart);

                    await clickAction(x, y)(chart);
                    await waitForChartStability(chart);
                }
            });
            test('touch', async () => {
                for (const { x, y } of iterLegendMarkerLabels(chart)) {
                    await tapAction(x, y)(chart);
                    await waitForChartStability(chart);

                    await tapAction(x, y)(chart);
                    await waitForChartStability(chart);
                }
            });

            afterEach(() => {
                expect(doubleClicks).toHaveLength(0);
                expect(clicks).toHaveLength(0);
                expect(legendClicks).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4]);
            });
        });
    });

    describe('AG-14232 legend toggling', () => {
        beforeEach(async () => {
            chart = await createChart({
                data: [
                    { name: 'Pizza', value: 3 },
                    { name: 'Cake', value: 4 },
                    { name: 'Quiche', value: 5 },
                ],
                series: [{ type: 'pie', angleKey: 'value', legendItemKey: 'name' }],
            });
        });
        describe('click', () => {
            test('mouse', async () => {
                for (const { x, y, text } of iterLegendMarkerLabels(chart)) {
                    await clickAction(x, y)(chart);
                    await compare(`pie-series-test-ts-pie-series-legend-click-${text}`);
                    await clickAction(x, y)(chart);
                }
            });
            test('touch', async () => {
                for (const { x, y, text } of iterLegendMarkerLabels(chart)) {
                    await tapAction(x, y)(chart);
                    await compare(`pie-series-test-ts-pie-series-legend-click-${text}`);
                    await tapAction(x, y)(chart);
                }
            });
        });
        describe('dblclick', () => {
            test('mouse', async () => {
                for (const { x, y } of iterLegendMarkerLabels(chart)) {
                    await doubleClickAction(x, y)(chart);
                    await compare(`pie-series-test-ts-pie-series-legend-All`);
                }
            });
            test('touch', async () => {
                for (const { x, y } of iterLegendMarkerLabels(chart)) {
                    await doubleTapAction(x, y)(chart);
                    await compare(`pie-series-test-ts-pie-series-legend-All`);
                }
            });
        });
    });

    describe('applyTransaction', () => {
        let chartProxy: AgChartProxy;
        let pieSeries: PieSeries;

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
                    { food: 'Pizza', value: 3 },
                    { food: 'Cake', value: 4 },
                ],
                series: [{ type: 'pie', angleKey: 'value', calloutLabelKey: 'food' }],
            });
            chartProxy = AgCharts.create(transactionOptions) as AgChartProxy;
            chart = deproxy(chartProxy);
            await waitForChartStability(chart);

            pieSeries = chart.series[0] as PieSeries;
        });

        afterEach(() => {
            chartProxy = undefined!;
            pieSeries = undefined!;
        });

        test('reprocesses palette entries for new data', async () => {
            expect(pieSeries.properties.fills).toEqual(['red', 'green']);

            await chartProxy.applyTransaction({
                add: [
                    { food: 'Quiche', value: 5 },
                    { food: 'Salad', value: 2 },
                ],
            });
            await waitForChartStability(chart);

            const nodeData = pieSeries.getNodeData() ?? [];
            expect(pieSeries.properties.fills).toEqual(['red', 'green', 'red', 'green']);
            expect(nodeData).toHaveLength(4);
            expect(nodeData.map((datum) => datum.sectorFormat.fill)).toEqual(['red', 'green', 'red', 'green']);
        });

        test('removes data items correctly', async () => {
            const initialData = chartProxy.getOptions().data!;
            expect(initialData).toHaveLength(2);
            const initialNodeData = pieSeries.getNodeData() ?? [];
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

            const nodeData = pieSeries.getNodeData() ?? [];
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
        const series: AgPieSeriesOptions[] = [
            {
                type: 'pie' as const,
                angleKey: 'value',
                calloutLabelKey: 'id',
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
                        type: 'pie',
                        angleKey: 'amount',
                        calloutLabelKey: 'asset',
                        sectorLabelKey: 'amount',
                    },
                ],
            };

            chart = await createChart(invalidDataOptions);
            await compare();

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [PieSeries-1 / angleRaw] ignored:",
    "[null]",
  ],
  [
    "AG Charts - invalid value of type [object] for [PieSeries-1 / sectorLabelValue] ignored:",
    "[null]",
  ],
]
`);
        });
    });

    describe('AG-11672 calloutLine.itemStyler', () => {
        type D = { name: string; size: number };
        type C = undefined;
        type M = MockPieCalloutLineItemStyler<D, C>;
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
                        type: 'pie',
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

    afterEach(() => {
        jest.restoreAllMocks();
    });
});
