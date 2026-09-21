import type { MatchImageSnapshotOptions } from 'jest-image-snapshot';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AgCharts, _ModuleSupport } from 'ag-charts-community';
import {
    type ChartTestCase,
    PATTERN_SNAPSHOT_DEFAULTS,
    cartesianChartAssertions,
    compareImageSnapshot,
    contextMenuAction,
    deproxy,
    expectNonBlank,
    expectWarningsCalls,
    setupMockCanvas,
    setupMockConsole,
    setupMockPointerEvent,
    waitForChartStability,
} from 'ag-charts-community-test';
import { Logger } from 'ag-charts-core';
import type {
    AgBubbleSeriesOptions,
    AgChartOptions,
    AgQuadrantChartOptions,
    AgQuadrantRegion,
    AgQuadrantRegionLabelOptions,
    AgQuadrantRegionLabelPosition,
    AgQuadrantRegionsLabelOptions,
    AgSeriesAreaBackgroundRegionLabel,
} from 'ag-charts-types';

import { DEFAULT_CONTEXT_MENU_CLASS } from '../../features/context-menu/contextMenuStyles';
import { prepareEnterpriseTestOptions } from '../../test/utils';
import { createQuadrant } from './quadrantPreset';

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
        label: {
            color: 'white',
            fontSize: 20,
        },
        topLeft: {
            fill: 'red',
            fillOpacity: 0.5,
            marker: { strokeWidth: 1 },
            stroke: 'red',
            strokeWidth: 4,
            label: {
                text: 'Top Left',
            },
        },
        topRight: {
            fill: 'green',
            marker: { fill: 'white', strokeWidth: 4, size: 20 },
            stroke: 'green',
            strokeWidth: 8,
            label: {
                text: 'Top Right',
                position: 'inside-inner-outer',
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
                color: { ref: 'foregroundColor' },
                position: 'inside-center-inner' as const,
                fontWeight: 'bold',
            },
        },
    },
};

const THEMED: AgQuadrantChartOptions = {
    ...NUMERIC,
    regions: {
        topLeft: { label: { text: 'Top Left' } },
        topRight: { label: { text: 'Top Right' } },
        bottomLeft: { label: { text: 'Bottom Left' } },
        bottomRight: { label: { text: 'Bottom Right' } },
    },
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
                            padding: { top: 4, right: 40, bottom: 4, left: 8 },
                        },
                    },
                },
            },
        },
    },
};

const REGION_LABEL_POSITIONS: AgQuadrantRegionLabelPosition[] = [
    'outside-outer',
    'outside-center',
    'outside-inner',
    'inside-outer-outer',
    'inside-outer-center',
    'inside-outer-inner',
    'inside-center-outer',
    'inside-center',
    'inside-center-inner',
    'inside-inner-outer',
    'inside-inner-center',
    'inside-inner-inner',
];

/** An off-centre pivot so that a mirrored placement is distinguishable from a centred one. */
function regionLabelOptions(
    position: AgQuadrantRegionLabelPosition,
    regions?: Partial<Record<'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight', AgQuadrantRegionLabelOptions>>,
    shared?: AgQuadrantRegionsLabelOptions
): AgQuadrantChartOptions {
    return {
        ...NUMERIC,
        pivot: { x: 25, y: -25 },
        regions: {
            label: { position, ...shared },
            topLeft: { label: { text: 'Top Left', ...regions?.topLeft } },
            topRight: { label: { text: 'Top Right', ...regions?.topRight } },
            bottomLeft: { label: { text: 'Bottom Left', ...regions?.bottomLeft } },
            bottomRight: { label: { text: 'Bottom Right', ...regions?.bottomRight } },
        },
    };
}

const assertions = cartesianChartAssertions({ seriesTypes: ['scatter'], axisTypes: { x: 'number', y: 'number' } });

interface QuadrantTestCase extends ChartTestCase {
    options: AgQuadrantChartOptions;
}

const EXAMPLES: Record<string, QuadrantTestCase> = {
    NO_PIVOT_NUMERIC: { options: NO_PIVOT_NUMERIC, assertions },
    PIVOT_NUMERIC: { options: PIVOT_NUMERIC, assertions },
    UNALIGNED_AXES_NUMERIC: { options: UNALIGNED_AXES_NUMERIC, assertions },
    // The pattern tile is resampled at a fractional offset; its edge pixels sit on the default threshold.
    ITEM_STYLERS_NUMERIC: {
        options: ITEM_STYLERS_NUMERIC,
        assertions,
        imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
    },
    BUBBLE_SIZED_NUMERIC: {
        options: BUBBLE_SIZED_NUMERIC,
        assertions: cartesianChartAssertions({ seriesTypes: ['bubble'], axisTypes: { x: 'number', y: 'number' } }),
    },
    STYLED: { options: STYLED, assertions },
    THEMED: { options: THEMED, assertions },
    REGION_LABEL_PER_REGION: {
        options: regionLabelOptions('inside-outer-outer', { bottomRight: { position: 'inside-inner-inner' } }),
        assertions,
    },
};

for (const position of REGION_LABEL_POSITIONS) {
    EXAMPLES[`REGION_LABEL_${position}`] = { options: regionLabelOptions(position), assertions };
}

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

    const compare = async (imageSnapshotDefaults?: MatchImageSnapshotOptions) => {
        await compareImageSnapshot(chart, ctx, imageSnapshotDefaults);
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
            if (example.warnings == null || example.warnings.length === 0) {
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
            await compare(example.imageSnapshotDefaults);

            if (example.extraScreenshotActions) {
                await example.extraScreenshotActions(chart);
                await compare(example.imageSnapshotDefaults);
            }
        }
    );

    it('forwards overrideDevicePixelRatio to the cartesian chart options', () => {
        const cartesianOptions = createQuadrant(
            { ...BUBBLE_SIZED_NUMERIC, overrideDevicePixelRatio: 2 } as AgQuadrantChartOptions,
            undefined,
            undefined,
            undefined,
            new Logger(),
            () => undefined
        );

        expect(cartesianOptions).toMatchObject({ overrideDevicePixelRatio: 2 });
    });

    it('accepts overrideDevicePixelRatio without a validation warning', async () => {
        const options = { ...BUBBLE_SIZED_NUMERIC, overrideDevicePixelRatio: 2 } as AgQuadrantChartOptions;
        prepareEnterpriseTestOptions(options);

        chart = AgCharts.createQuadrantChart(options);
        await waitForChartStability(chart);

        expect(console.warn).not.toHaveBeenCalled();
    });

    it('forwards sizeName to the tooltip renderer params', () => {
        const rendererParams: unknown[] = [];

        const cartesianOptions = createQuadrant(
            {
                ...BUBBLE_SIZED_NUMERIC,
                sizeName: 'Population',
                tooltip: {
                    renderer: (params) => {
                        rendererParams.push(params);
                        return {};
                    },
                },
            },
            undefined,
            undefined,
            undefined,
            new Logger(),
            () => undefined
        );

        const bubbleSeries = cartesianOptions.series?.find(
            (series): series is AgBubbleSeriesOptions => series.type === 'bubble'
        );
        expect(bubbleSeries).toBeDefined();
        expect(bubbleSeries?.sizeName).toBe('Population');

        bubbleSeries?.tooltip?.renderer?.({
            datum: { x: -100, y: -100, size: 1 },
            xKey: 'x',
            yKey: 'y',
            sizeKey: 'size',
            sizeName: 'Population',
        } as Parameters<NonNullable<NonNullable<AgBubbleSeriesOptions['tooltip']>['renderer']>>[0]);

        expect(rendererParams).toHaveLength(1);
        expect(rendererParams[0]).toMatchObject({ sizeName: 'Population', region: 'bottom-left' });
    });

    describe('region label spacing', () => {
        const SPACING_EXAMPLES: Record<string, AgQuadrantChartOptions> = {
            AWAY_FROM_PIVOT: regionLabelOptions('inside-inner-inner', undefined, { spacing: 40 }),
            TOWARDS_PIVOT: regionLabelOptions('inside-outer-outer', undefined, { spacing: 40 }),
            CLEAR_OF_REGION: {
                ...regionLabelOptions('outside-outer', undefined, { spacing: 20 }),
                padding: { top: 50, right: 60, bottom: 50, left: 60 },
            },
            CENTRED_ON_ONE_AXIS: regionLabelOptions('inside-outer-center', undefined, { spacing: 40 }),
            NONE: regionLabelOptions('inside-inner-inner', undefined, { spacing: 0 }),
            PER_REGION: regionLabelOptions('inside-inner-inner', { bottomRight: { spacing: 40 } }),
        };

        it.each(Object.entries(SPACING_EXAMPLES))(
            'for %s it should render to canvas as expected',
            async (_exampleName, exampleOptions) => {
                const options: AgQuadrantChartOptions = { ...exampleOptions };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.createQuadrantChart(options);
                await compare();
            }
        );
    });

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

    describe('region label padding', () => {
        const paddingOptions = (padding: AgSeriesAreaBackgroundRegionLabel['padding']): AgQuadrantChartOptions => ({
            ...regionLabelOptions('inside-inner-inner'),
            theme: {
                overrides: {
                    scatter: {
                        seriesArea: {
                            backgroundRegions: {
                                label: {
                                    border: { enabled: true, stroke: 'indigo', strokeWidth: 2 },
                                    fill: 'thistle',
                                    padding,
                                },
                            },
                        },
                    },
                },
            },
        });

        const preparedPaddingOptions = (padding: AgSeriesAreaBackgroundRegionLabel['padding']) => {
            const options = paddingOptions(padding);
            prepareEnterpriseTestOptions(options);
            return options;
        };

        it.each([
            ['NONE', 0],
            ['WIDE', 20],
        ])('for %s it should render to canvas as expected', async (_exampleName, padding) => {
            chart = AgCharts.createQuadrantChart(preparedPaddingOptions(padding));
            await compare();
        });

        // A label border switches the default to the conditional branch of `$applyPadding`, whose sides are vertices
        // of their own that a themed value must still outrank.
        it('should render a themed single number identically to the equivalent padding object', async () => {
            // The mock canvas only backs the first chart created in a test, so reuse one chart.
            chart = AgCharts.createQuadrantChart(preparedPaddingOptions(20));
            await waitForChartStability(chart);
            const shorthandImage = ctx.snapshot();
            expectNonBlank(shorthandImage);

            await chart.update(preparedPaddingOptions({ top: 20, right: 20, bottom: 20, left: 20 }));
            await waitForChartStability(chart);

            expect(ctx.snapshot()).toMatchImage(shorthandImage);
        });
    });
});

// The preset `themeTemplate` is baked into the resolved `ChartTheme`, so charts sharing a theme
// value must not inherit each other's preset template.
describe('Quadrant Preset theme isolation', () => {
    setupMockConsole();

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
        expect(axes.x.line.enabled).toBe(true);
        expect(axes.x.line.stroke).toBe('#8c8e8f');
        expect(axes.x.line.strokeWidth).toBe(1);
    };

    const expectPlainStyling = (axes: Record<'x' | 'y', Record<string, any>>) => {
        expect(axes.x.line.enabled).toBe(false);
        expect(axes.x.line.stroke).toBe('#dcdddd');
    };

    it('does not leak the preset template to a plain chart created afterwards', () => {
        expectQuadrantStyling(resolveAxes(quadrantOptions(), 'quadrant'));
        expectPlainStyling(resolveAxes(plainOptions()));
    });

    it('does not lose the preset template to a plain chart created beforehand', () => {
        expectPlainStyling(resolveAxes(plainOptions()));
        expectQuadrantStyling(resolveAxes(quadrantOptions(), 'quadrant'));
    });

    // The preset omits an axis-line strokeWidth so the common template's width alias survives the merge.
    it('still resolves a deprecated line.width theme override to strokeWidth on a quadrant chart', () => {
        const axes = resolveAxes(
            {
                ...quadrantOptions(),
                theme: { overrides: { scatter: { axes: { number: { line: { width: 3 } } } } } },
            },
            'quadrant'
        );

        expect(axes.x.line.strokeWidth).toBe(3);
        expectWarningsCalls().toEqual([
            [
                'AG Charts - Option `theme.overrides.scatter.axes.number.line.width` is deprecated. Use `strokeWidth` instead.',
            ],
        ]);
    });
});

describe('Quadrant Preset label enabled default', () => {
    const resolveLabelEnabled = (options: Partial<AgQuadrantChartOptions>) => {
        const { processedOptions } = new _ModuleSupport.ChartOptions(
            { data: NUMERIC.data, xKey: 'x', yKey: 'y', ...options },
            {},
            {},
            {},
            { presetType: 'quadrant' }
        ) as unknown as { processedOptions: { series: Record<string, any>[] } };
        return processedOptions.series[0].label.enabled;
    };

    const cases: [string, Partial<AgQuadrantChartOptions>, boolean][] = [
        ['AC1: labelKey given', { labelKey: 'label' }, true],
        ['AC1: labelKey given alongside label styling', { labelKey: 'label', label: { color: 'purple' } }, true],
        ['AC1: empty label object opts in', { label: {} }, true],
        ['AC1: label styling without enabled opts in', { label: { fontSize: 12 } }, true],
        ['AC1: label object opts in on the bubble branch', { sizeKey: 'size', label: {} }, true],
        ['AC1: label object opts in even with an empty labelKey', { labelKey: '', label: { fontSize: 12 } }, true],
        ['AC2: no labelKey', {}, false],
        ['AC2: no labelKey on the bubble branch', { sizeKey: 'size' }, false],
        ['AC2: empty labelKey', { labelKey: '' }, false],
        ['AC3: no labelKey but label.enabled', { label: { enabled: true } }, true],
        ['AC3: labelKey but label.enabled false', { labelKey: 'label', label: { enabled: false } }, false],
    ];

    it.each(cases)('%s', (_name, options, expected) => {
        expect(resolveLabelEnabled(options)).toBe(expected);
    });
});

describe('AG-18413 quadrant with a key naming no column', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: any;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const createQuadrantChart = async (overrides: Partial<AgQuadrantChartOptions>) => {
        const options: AgQuadrantChartOptions = { ...NUMERIC, ...overrides };
        prepareEnterpriseTestOptions(options as AgChartOptions);
        chart = deproxy(AgCharts.createQuadrantChart(options) as any) as any;
        await waitForChartStability(chart);
        return chart.series[0];
    };

    // An empty key names a column like any other string, so it takes the unmatched-key warning —
    // and, with nothing renderable behind it, the no-data overlay stands alone over the axes.
    it('draws no markers and warns for an empty sizeKey', async () => {
        const series = await createQuadrantChart({ sizeKey: '' });

        expect(series.getNodeData()).toEqual([]);
        expect(series.hasData).toBe(false);
        // The no-data overlay stands alone over the axes: no markers, and no gridlines behind it.
        expect(chart.axes.map((a: { gridLineGroup: { visible: boolean } }) => a.gridLineGroup.visible)).toEqual([
            false,
            false,
        ]);
        expectWarningsCalls().toEqual([[`AG Charts - the key '' was not found in any data element for ${series.id}.`]]);
    });

    it('keeps the series populated for a sizeKey that does name a column', async () => {
        const series = await createQuadrantChart({ sizeKey: 'size' });

        expect(series.getNodeData()).toHaveLength(NUMERIC.data!.length);
        expectWarningsCalls().toEqual([]);
    });
});

// `region` must reach the two series-area scopes and no others. These are compile-time assertions; the
// `@ts-expect-error` directives fail the build if the generic threading regresses.
export const CONTEXT_MENU_TYPE_CHECK: AgQuadrantChartOptions = {
    xKey: 'x',
    yKey: 'y',
    contextMenu: {
        getItems: (params) => {
            const regions: (AgQuadrantRegion | undefined)[] = [];
            if (params.showOn === 'series-node') {
                regions.push(params.region);
            }
            if (params.showOn === 'series-area') {
                regions.push(params.region);
            }
            if (params.showOn === 'axis') {
                // @ts-expect-error an axis click does not fall in a region
                regions.push(params.region);
            }
            for (const scope of params.allShowOnParams) {
                if (scope.showOn === 'series-node') {
                    regions.push(scope.region);
                }
                if (scope.showOn === 'legend-item') {
                    // @ts-expect-error a legend item does not fall in a region
                    regions.push(scope.region);
                }
            }
            return regions.map((region) => ({ label: region ?? 'none' }));
        },
    },
};

export const PLAIN_CONTEXT_MENU_TYPE_CHECK: AgChartOptions = {
    contextMenu: {
        getItems: (params) => {
            if (params.showOn === 'series-node') {
                // @ts-expect-error region is a quadrant preset addition, not part of the shared API
                return [{ label: String(params.region) }];
            }
            return undefined;
        },
    },
};

describe('Quadrant Preset context menu region', () => {
    setupMockConsole();
    setupMockCanvas();
    setupMockPointerEvent();

    // Away from the origin, so a pass proves the region comes from the pivot and not the sign of the value.
    const PIVOT = { x: 25, y: -25 };

    const CONTEXT_MENU_OPTIONS: AgQuadrantChartOptions = {
        data: [
            { label: 'bottom-left', x: -100, y: -100 },
            { label: 'top-left', x: -75, y: 75 },
            { label: 'top-right', x: 75, y: 75 },
            { label: 'bottom-right', x: 75, y: -75 },
        ],
        xKey: 'x',
        yKey: 'y',
        labelKey: 'label',
        pivot: PIVOT,
        // A domain far wider than the data keeps every marker away from the edge-placed axis labels, which claim a
        // context-menu click of their own.
        xAxis: { min: -400, max: 400 },
        yAxis: { min: -400, max: 400 },
    };

    let chart: any;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const prepareChart = async (
        contextMenu: AgQuadrantChartOptions['contextMenu'],
        overrides?: Partial<AgQuadrantChartOptions>
    ) => {
        const options: AgQuadrantChartOptions = { ...CONTEXT_MENU_OPTIONS, ...overrides, contextMenu };
        prepareEnterpriseTestOptions(options as AgChartOptions);
        chart = AgCharts.createQuadrantChart(options);
        await waitForChartStability(chart);
    };

    /** Canvas point of the marker whose datum carries `label`. */
    const markerPoint = (label: string) => {
        const series = deproxy(chart).series[0] as any;
        const node = series.getNodeData().find((n: any) => n.datum.label === label);
        expect(node).toBeDefined();
        return _ModuleSupport.Transformable.toCanvasPoint(series.contentGroup, node.point.x, node.point.y);
    };

    /**
     * A point inside the series area in the named quadrant, clear of both the markers and the crossing axes.
     * x increases rightwards and y increases upwards, so the series rect corners map onto the quadrants.
     */
    const seriesAreaPoint = (quadrant: AgQuadrantRegion) => {
        const { x, y, width, height } = deproxy(chart).seriesRect!;
        const left = quadrant === 'top-left' || quadrant === 'bottom-left';
        const top = quadrant === 'top-left' || quadrant === 'top-right';
        return {
            canvasX: x + width * (left ? 0.15 : 0.85),
            canvasY: y + height * (top ? 0.15 : 0.85),
        };
    };

    const rightClick = async (point: { canvasX: number; canvasY: number }) => {
        await contextMenuAction(point.canvasX, point.canvasY)(chart);
        await waitForChartStability(chart);
    };

    const QUADRANTS: AgQuadrantRegion[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

    it.each(QUADRANTS)('reports the %s region for a series-node click', async (quadrant) => {
        const getItems = vi.fn((_params: any) => []);
        await prepareChart({ enabled: true, getItems });

        await rightClick(markerPoint(quadrant));

        expect(getItems).toHaveBeenCalledTimes(1);
        const params = getItems.mock.calls[0][0];
        expect(params.showOn).toBe('series-node');
        expect(params.region).toBe(quadrant);
    });

    it.each(QUADRANTS)('reports the %s region for a series-area click', async (quadrant) => {
        const getItems = vi.fn((_params: any) => []);
        await prepareChart({ enabled: true, getItems });

        await rightClick(seriesAreaPoint(quadrant));

        expect(getItems).toHaveBeenCalledTimes(1);
        const params = getItems.mock.calls[0][0];
        expect(params.showOn).toBe('series-area');
        expect(params.region).toBe(quadrant);
    });

    it('derives the series-area region from the pivot rather than from zero', async () => {
        const getItems = vi.fn((_params: any) => []);
        await prepareChart({ enabled: true, getItems });

        const { x, y } = deproxy(chart).seriesRect!;
        const axes = deproxy(chart).axes as any[];
        const xAxis = axes.find((a) => a.direction === 'x');
        const yAxis = axes.find((a) => a.direction === 'y');
        expect(xAxis).toBeDefined();
        expect(yAxis).toBeDefined();

        // Positive x and negative y: a zero-based split would call this 'bottom-right', the pivot puts it top-left.
        await rightClick({ canvasX: x + xAxis.scale.convert(10), canvasY: y + yAxis.scale.convert(-10) });

        const params = getItems.mock.calls[0][0];
        expect(params.coordinates.x.value).toBeGreaterThan(0);
        expect(params.coordinates.y.value).toBeLessThan(0);
        expect(params.region).toBe('top-left');
    });

    it('enriches the series-node and series-area entries in allShowOnParams', async () => {
        const getItems = vi.fn((_params: any) => []);
        await prepareChart({ enabled: true, getItems });

        await rightClick(markerPoint('top-right'));

        const params = getItems.mock.calls[0][0];
        const node = params.allShowOnParams.find((p: any) => p.showOn === 'series-node');
        const area = params.allShowOnParams.find((p: any) => p.showOn === 'series-area');
        expect(node).toBeDefined();
        expect(area).toBeDefined();
        expect(node.region).toBe('top-right');
        expect(node.region).toBe(params.region);
        expect(area.region).toBe('top-right');
    });

    it('leaves an overlapping series-area scope without a region when an axis label takes the click', async () => {
        const getItems = vi.fn((_params: any) => []);
        // Only crossing-placed labels put an axis hit target inside the series area.
        await prepareChart({ enabled: true, getItems }, { axisPlacement: { label: 'crossing' } });

        const { x, y, width } = deproxy(chart).seriesRect!;
        const yAxis = (deproxy(chart).axes as any[]).find((a) => a.direction === 'y');
        await rightClick({ canvasX: x + width * 0.3, canvasY: y + yAxis.scale.convert(PIVOT.y) });

        const params = getItems.mock.calls[0][0];
        expect(params.showOn).toBe('axis');
        // An axis click reports no coordinates, so the region behind it cannot be derived.
        expect(params.coordinates).toBeUndefined();
        const area = params.allShowOnParams.find((p: any) => p.showOn === 'series-area');
        expect(area).toBeDefined();
        expect('region' in area).toBe(true);
        expect(area.region).toBeUndefined();
    });

    it('leaves a click outside the series area without a region', async () => {
        const getItems = vi.fn((_params: any) => []);
        await prepareChart({ enabled: true, getItems });

        await rightClick({ canvasX: 1, canvasY: 1 });

        expect(getItems).toHaveBeenCalledTimes(1);
        const params = getItems.mock.calls[0][0];
        expect(params.showOn).toBe('always');
        expect('region' in params).toBe(false);
    });

    it('falls back to items when the composed getItems returns undefined', async () => {
        const getItems = vi.fn((_params: any) => undefined);
        await prepareChart({ enabled: true, getItems, items: ['download'] });

        await rightClick(seriesAreaPoint('top-right'));

        expect(getItems).toHaveBeenCalledTimes(1);
        expect(getItems.mock.results[0].value).toBeUndefined();
        expect(document.body.getElementsByClassName(DEFAULT_CONTEXT_MENU_CLASS)).toMatchSnapshot();
    });
});
