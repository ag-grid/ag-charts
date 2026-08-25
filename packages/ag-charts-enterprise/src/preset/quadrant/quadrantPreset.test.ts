import { afterEach, describe, expect, it } from 'vitest';

import { AgCharts, _ModuleSupport } from 'ag-charts-community';
import {
    type ChartTestCase,
    cartesianChartAssertions,
    compareImageSnapshot,
    expectNonBlank,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import type { AgChartOptions, AgQuadrantChartOptions } from 'ag-charts-types';

import { prepareEnterpriseTestOptions } from '../../test/utils';

const NUMERIC: AgQuadrantChartOptions = {
    data: [
        { label: 'One', x: -100, y: -100, size: 1 },
        { label: 'Two', x: -75, y: -75, size: 2 },
        { label: 'Three', x: -75, y: 75, size: 3 },
        { label: 'Four', x: 75, y: 75, size: 4 },
        { label: 'Five', x: 75, y: -75, size: 5 },
        { label: 'Six', x: 100, y: 100, size: 6 },
    ],
    xKey: 'x',
    yKey: 'y',
    label: { enabled: true },
    labelKey: 'label',
    xName: 'X Name',
    yName: 'Y Name',
    xAxis: { title: { text: 'X Axis' } },
    yAxis: { title: { text: 'Y Axis' } },
};

const NO_PIVOT_NUMERIC: AgQuadrantChartOptions = {
    ...NUMERIC,
};

const PIVOT_NUMERIC: AgQuadrantChartOptions = {
    ...NUMERIC,
    pivot: { x: 25, y: -25 },
};

const UNALIGNED_AXES_NUMERIC: AgQuadrantChartOptions = {
    ...NUMERIC,
    pivot: { x: 25, y: -25 },
    alignAxesToPivot: false,
};

const BUBBLE_SIZED_NUMERIC: AgQuadrantChartOptions = {
    ...NUMERIC,
    sizeKey: 'size',
};

const ITEM_STYLERS_NUMERIC: AgQuadrantChartOptions = {
    ...NUMERIC,
    itemStyler: (params) => {
        switch (params.region) {
            case 'top-left':
                return { fill: 'red', stroke: 'black' };
            case 'top-right':
                return { fill: 'white', stroke: 'green', strokeWidth: 4, size: 20 };
            case 'bottom-left':
                return { fill: 'blue', stroke: 'black', shape: 'star', size: 20 };
            case 'bottom-right':
                return {
                    fill: {
                        type: 'pattern',
                        pattern: 'squares',
                        fill: 'sandybrown',
                        stroke: 'maroon',
                        strokeWidth: 2,
                        width: 20,
                        height: 20,
                        backgroundFill: 'bisque',
                    },
                    size: 40,
                    stroke: 'black',
                };
        }
    },
};

const STYLED: AgQuadrantChartOptions = {
    ...NUMERIC,
    label: {
        color: 'purple',
        fontSize: 14,
        fontWeight: 'bold',
    },
    regions: {
        topLeft: {
            fill: 'red',
            fillOpacity: 0.5,
            marker: { strokeWidth: 1 },
            stroke: 'red',
            strokeWidth: 4,
            label: {
                text: 'Top Left',
                color: 'white',
                fontSize: 20,
            },
        },
        topRight: {
            fill: 'green',
            marker: { fill: 'white', strokeWidth: 4, size: 20 },
            stroke: 'green',
            strokeWidth: 8,
            label: {
                text: 'Top Right',
                position: 'inside-bottom-left',
                color: 'white',
                fontSize: 20,
            },
        },
        bottomLeft: {
            fill: {
                type: 'gradient',
                rotation: 225,
                colorStops: [
                    { color: 'navy', stop: 0 },
                    { color: 'powderblue', stop: 1 },
                ],
            },
            fillOpacity: 0.5,
            marker: { fill: 'navy', strokeWidth: 0, size: 20, shape: 'star' },
            label: {
                text: 'Bottom Left',
                color: 'red',
                rotation: 45,
                fontSize: 20,
            },
        },
        bottomRight: {
            fill: {
                type: 'pattern',
                pattern: 'squares',
                fill: 'sandybrown',
                stroke: 'maroon',
                width: 20,
                height: 20,
                backgroundFill: 'bisque',
            },
            fillOpacity: 0.5,
            marker: { strokeWidth: 1, size: 40 },
            stroke: 'yellow',
            strokeWidth: 4,
            label: {
                text: 'Bottom Right',
                position: 'left' as const,
                fontSize: 20,
                fontWeight: 'bold',
            },
        },
    },
};

const THEMED: AgQuadrantChartOptions = {
    ...NUMERIC,
    theme: {
        overrides: {
            scatter: {
                seriesArea: {
                    backgroundRegions: {
                        fill: {
                            type: 'gradient' as const,
                            colorStops: [{ color: 'orangered' }, { color: 'lightsalmon' }],
                        },
                        fillOpacity: 0.8,
                        stroke: 'crimson',
                        strokeOpacity: 0.8,
                        strokeWidth: 8,
                        label: {
                            border: {
                                enabled: true,
                                stroke: 'indigo',
                                strokeOpacity: 0.8,
                                strokeWidth: 4,
                            },
                            color: 'indigo',
                            cornerRadius: 8,
                            fill: {
                                type: 'gradient' as const,
                                colorStops: [{ color: 'mediumpurple' }, { color: 'thistle' }],
                            },
                            fontSize: 14,
                            fontWeight: 'bold' as const,
                            padding: { top: 12, right: 20, bottom: 12, left: 20 },
                            position: 'inside' as const,
                        },
                    },
                },
            },
        },
    },
};

const assertions = cartesianChartAssertions({ seriesTypes: ['scatter'], axisTypes: { x: 'number', y: 'number' } });

interface QuadrantTestCase extends ChartTestCase {
    options: AgQuadrantChartOptions;
}

const EXAMPLES: Record<string, QuadrantTestCase> = {
    NO_PIVOT_NUMERIC: { options: NO_PIVOT_NUMERIC, assertions },
    PIVOT_NUMERIC: { options: PIVOT_NUMERIC, assertions },
    UNALIGNED_AXES_NUMERIC: { options: UNALIGNED_AXES_NUMERIC, assertions },
    ITEM_STYLERS_NUMERIC: { options: ITEM_STYLERS_NUMERIC, assertions },
    BUBBLE_SIZED_NUMERIC: {
        options: BUBBLE_SIZED_NUMERIC,
        assertions: cartesianChartAssertions({ seriesTypes: ['bubble'], axisTypes: { x: 'number', y: 'number' } }),
    },
    STYLED: { options: STYLED, assertions },
    THEMED: { options: THEMED, assertions },
};

describe('Quadrant Preset', () => {
    setupMockConsole();
    let chart: any;

    afterEach(async () => {
        if (chart) {
            await waitForChartStability(chart);
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const compare = async () => {
        await compareImageSnapshot(chart, ctx);
    };

    it.each(Object.entries(EXAMPLES))(
        'for %s it should create chart instance as expected',
        async (_exampleName, example) => {
            const options: AgQuadrantChartOptions = { ...example.options };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.createQuadrantChart(options);
            await waitForChartStability(chart);
            await example.assertions(chart);

            if (example.warnings) {
                for (const [index, message] of example.warnings.entries()) {
                    expect(console.warn).toHaveBeenNthCalledWith(
                        index + 1,
                        ...(Array.isArray(message) ? message : [message])
                    );
                }
            }
            if (!example.warnings?.length) {
                expect(console.warn).not.toHaveBeenCalled();
            }
        }
    );

    it.each(Object.entries(EXAMPLES))(
        'for %s it should render to canvas as expected',
        async (_exampleName, example) => {
            const options: AgQuadrantChartOptions = { ...example.options };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.createQuadrantChart(options);
            await compare();

            if (example.extraScreenshotActions) {
                await example.extraScreenshotActions(chart);
                await compare();
            }
        }
    );

    it.each([false, true])(
        'starting from alignAxesToPivot %s it should render identically after toggling twice',
        async (alignAxesToPivot) => {
            const options: AgQuadrantChartOptions = { ...PIVOT_NUMERIC, alignAxesToPivot };
            prepareEnterpriseTestOptions(options);

            // The mock canvas only backs the first chart created in a test, so reuse one chart.
            chart = AgCharts.createQuadrantChart(options);
            await waitForChartStability(chart);
            const initialImage = ctx.snapshot();
            expectNonBlank(initialImage);

            for (const toggled of [!alignAxesToPivot, alignAxesToPivot]) {
                await chart.update({ ...options, alignAxesToPivot: toggled });
                await waitForChartStability(chart);
            }

            expect(ctx.snapshot()).toMatchImage(initialImage);
        }
    );
});

// The preset `themeTemplate` is baked into the resolved `ChartTheme`, so charts sharing a theme
// value must not inherit each other's preset template.
describe('Quadrant Preset theme isolation', () => {
    const DATA = NUMERIC.data;

    const resolveAxes = (options: AgChartOptions, presetType?: 'quadrant') => {
        const { processedOptions } = new _ModuleSupport.ChartOptions(
            options,
            {} as AgChartOptions,
            {},
            {},
            presetType == null ? {} : { presetType }
        ) as unknown as { processedOptions: { axes: Record<'x' | 'y', Record<string, any>> } };
        return processedOptions.axes;
    };

    const quadrantOptions = () => ({ data: DATA, xKey: 'x', yKey: 'y' }) as unknown as AgChartOptions;
    const plainOptions = () =>
        ({ data: DATA, series: [{ type: 'scatter', xKey: 'x', yKey: 'y' }] }) as unknown as AgChartOptions;

    const expectQuadrantStyling = (axes: Record<'x' | 'y', Record<string, any>>) => {
        expect(axes.x.label.enabled).toBe(false);
        expect(axes.x.line.width).toBe(2);
    };

    const expectPlainStyling = (axes: Record<'x' | 'y', Record<string, any>>) => {
        expect(axes.x.label.enabled).toBe(true);
        expect(axes.x.line.width).toBe(1);
    };

    it('does not leak the preset template to a plain chart created afterwards', () => {
        expectQuadrantStyling(resolveAxes(quadrantOptions(), 'quadrant'));
        expectPlainStyling(resolveAxes(plainOptions()));
    });

    it('does not lose the preset template to a plain chart created beforehand', () => {
        expectPlainStyling(resolveAxes(plainOptions()));
        expectQuadrantStyling(resolveAxes(quadrantOptions(), 'quadrant'));
    });
});

describe('Quadrant Preset bigint pivot (AG-18313)', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();
    let chart: any;

    afterEach(async () => {
        if (chart) {
            await waitForChartStability(chart);
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const PIVOT_X = 9_007_199_254_740_993n;
    const PIVOT_Y = 9_007_199_254_740_995n;

    const BIGINT_DATA = [
        { x: PIVOT_X - 2n, y: PIVOT_Y - 2n },
        { x: PIVOT_X + 2n, y: PIVOT_Y + 2n },
    ];

    const bigintPivotOptions = (): AgQuadrantChartOptions => ({
        data: BIGINT_DATA,
        xKey: 'x',
        yKey: 'y',
        pivot: { x: PIVOT_X, y: PIVOT_Y },
    });

    it('passes a bigint pivot through to crossAt without coercion', () => {
        const { processedOptions } = new _ModuleSupport.ChartOptions(
            bigintPivotOptions() as AgChartOptions,
            {} as AgChartOptions,
            {},
            {},
            { presetType: 'quadrant' }
        ) as unknown as { processedOptions: { axes: Record<'x' | 'y', Record<string, any>> } };

        expect(processedOptions.axes.x.crossAt.value).toBe(PIVOT_Y);
        expect(processedOptions.axes.y.crossAt.value).toBe(PIVOT_X);
    });

    it('renders a bigint pivot without validation warnings', async () => {
        const options = bigintPivotOptions();
        prepareEnterpriseTestOptions(options as AgChartOptions);

        chart = AgCharts.createQuadrantChart(options);
        await waitForChartStability(chart);

        expect(console.warn).not.toHaveBeenCalled();
        expectNonBlank(ctx.snapshot());
    });
});
