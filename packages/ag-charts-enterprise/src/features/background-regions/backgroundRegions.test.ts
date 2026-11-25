import { describe } from 'vitest';

import {
    type CartesianTestCase,
    cartesianChartAssertions,
    compareImageSnapshot,
    deproxy,
    expectWarningsCalls,
    getCrossLineLabelNode,
    getSeriesSelectionNodes,
    prepareProcessedOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import { Transformable } from 'ag-charts-core';
import type {
    AgCartesianChartOptions,
    AgCartesianCrossLineLabelPlacement,
    AgChartInstance,
    AgChartOptions,
    AgSeriesAreaBackgroundRegion,
    AgSeriesLabelCollideWithOptions,
} from 'ag-charts-types';

import { getBackgroundRegionLabelBox } from '../../test/featureAccessors';
import { createEnterpriseChart, prepareEnterpriseTestOptions } from '../../test/utils';
import { anchors } from './cartesianBackgroundRegion';

const NUMERIC: AgCartesianChartOptions = {
    data: [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
    ],
    series: [{ type: 'scatter', xKey: 'x', yKey: 'y' }],
    axes: { x: { type: 'number', position: 'bottom' }, y: { type: 'number', position: 'left' } },
};

const TIME: AgCartesianChartOptions = {
    data: [
        { x: new Date('2026-01-01'), y: 0 },
        { x: new Date('2026-01-02'), y: 100 },
    ],
    series: [{ type: 'scatter', xKey: 'x', yKey: 'y' }],
    axes: { x: { type: 'time', position: 'bottom' }, y: { type: 'number', position: 'left' } },
};

const UNIT_TIME: AgCartesianChartOptions = {
    data: [
        { x: new Date('2026-01-01'), y: 0 },
        { x: new Date('2026-02-01'), y: 20 },
        { x: new Date('2026-03-01'), y: 40 },
        { x: new Date('2026-04-01'), y: 60 },
        { x: new Date('2026-05-01'), y: 40 },
        { x: new Date('2026-06-01'), y: 100 },
    ],
    series: [{ type: 'scatter', xKey: 'x', yKey: 'y' }],
    axes: {
        x: { type: 'unit-time', position: 'bottom', interval: { step: 'month' } },
        y: { type: 'number', position: 'left' },
    },
};

const ORDINAL_TIME: AgCartesianChartOptions = {
    data: [
        { x: new Date('2026-01-01'), y: 0 },
        { x: new Date('2026-02-01'), y: 20 },
        { x: new Date('2026-03-01'), y: 40 },
        { x: new Date('2026-04-01'), y: 60 },
        { x: new Date('2026-05-01'), y: 40 },
        { x: new Date('2026-06-01'), y: 100 },
    ],
    series: [{ type: 'scatter', xKey: 'x', yKey: 'y' }],
    axes: { x: { type: 'ordinal-time', position: 'bottom' }, y: { type: 'number', position: 'left' } },
};

const CATEGORY: AgCartesianChartOptions = {
    data: [
        { x: 'one', y: 20 },
        { x: 'two', y: 40 },
        { x: 'three', y: 60 },
        { x: 'four', y: 40 },
        { x: 'five', y: 100 },
    ],
    series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
    axes: { x: { type: 'category', position: 'bottom' }, y: { type: 'number', position: 'left' } },
};

const NO_RANGES_NUMERIC = {
    ...NUMERIC,
    seriesArea: {
        backgroundRegions: [
            {
                fill: 'lightsalmon',
                fillOpacity: 0.8,
            },
        ],
    },
};

const XRANGE_NUMERIC = {
    ...NUMERIC,
    seriesArea: {
        backgroundRegions: [
            {
                fill: 'lightsalmon',
                fillOpacity: 0.8,
                xRange: { start: 20, end: 80 },
            },
        ],
    },
};

const YRANGE_NUMERIC = {
    ...NUMERIC,
    seriesArea: {
        backgroundRegions: [
            {
                fill: 'lightsalmon',
                fillOpacity: 0.8,
                yRange: { start: 20, end: 80 },
            },
        ],
    },
};

const BOTH_RANGES_START_NUMERIC = {
    ...NUMERIC,
    seriesArea: {
        backgroundRegions: [
            {
                fill: 'lightsalmon',
                fillOpacity: 0.8,
                xRange: { start: 20 },
                yRange: { start: 20 },
            },
        ],
    },
};

const BOTH_RANGES_END_NUMERIC = {
    ...NUMERIC,
    seriesArea: {
        backgroundRegions: [
            {
                fill: 'lightsalmon',
                fillOpacity: 0.8,
                xRange: { end: 80 },
                yRange: { end: 80 },
            },
        ],
    },
};

const BOTH_RANGES_NUMERIC = {
    ...NUMERIC,
    seriesArea: {
        backgroundRegions: [
            {
                fill: 'lightsalmon',
                fillOpacity: 0.8,
                xRange: { start: 20, end: 80 },
                yRange: { start: 20, end: 80 },
            },
        ],
    },
};

const OVERLAPPING_RANGES_NUMERIC = {
    ...NUMERIC,
    seriesArea: {
        backgroundRegions: [
            {
                fill: 'lightsalmon',
                fillOpacity: 0.8,
                xRange: { start: 20, end: 60 },
                yRange: { start: 20, end: 60 },
            },
            {
                fill: 'thistle',
                fillOpacity: 0.8,
                xRange: { start: 40, end: 80 },
                yRange: { start: 40, end: 80 },
            },
        ],
    },
};

const SECONDARY_AXIS_NUMERIC: AgCartesianChartOptions = {
    series: [
        {
            type: 'scatter',
            legendItemName: 'one',
            xKey: 'x',
            yKey: 'y',
            data: [
                { x: 0, y: 0 },
                { x: 100, y: 100 },
            ],
        },
        {
            type: 'scatter',
            legendItemName: 'two',
            xKey: 'x',
            yKey: 'y',
            xKeyAxis: 'xSecondary',
            data: [
                { x: 0, y: 0 },
                { x: 100, y: 100 },
            ],
        },
    ],
    axes: {
        x: { type: 'number', position: 'bottom' },
        y: { type: 'number', position: 'left' },
        xSecondary: { type: 'number', position: 'top' },
    },
    seriesArea: {
        backgroundRegions: [
            {
                fill: 'lightsalmon',
                fillOpacity: 0.8,
                xRange: { axis: 'xSecondary', start: 20, end: 60 },
                yRange: { start: 20, end: 60 },
            },
            {
                fill: 'thistle',
                fillOpacity: 0.8,
                xRange: { start: 40, end: 80 },
                yRange: { start: 40, end: 80 },
            },
        ],
    },
};

const BOTH_RANGES_TIME = {
    ...TIME,
    seriesArea: {
        backgroundRegions: [
            {
                fill: 'lightsalmon',
                fillOpacity: 0.8,
                xRange: {
                    start: new Date('2026-01-01 06:00:00'),
                    end: new Date('2026-01-01 18:00:00'),
                },
                yRange: { start: 20, end: 80 },
            },
        ],
    },
};

const BOTH_RANGES_UNIT_TIME = {
    ...UNIT_TIME,
    seriesArea: {
        backgroundRegions: [
            {
                fill: 'lightsalmon',
                fillOpacity: 0.8,
                xRange: {
                    start: new Date('2026-02-01'),
                    end: new Date('2026-04-01'),
                },
                yRange: { start: 20, end: 80 },
            },
        ],
    },
};

const BOTH_RANGES_ORDINAL_TIME = {
    ...ORDINAL_TIME,
    seriesArea: {
        backgroundRegions: [
            {
                fill: 'lightsalmon',
                fillOpacity: 0.8,
                xRange: {
                    start: new Date('2026-02-01'),
                    end: new Date('2026-04-01'),
                },
                yRange: { start: 20, end: 80 },
            },
        ],
    },
};

const BOTH_RANGES_CATEGORY = {
    ...CATEGORY,
    seriesArea: {
        backgroundRegions: [
            {
                fill: 'lightsalmon',
                fillOpacity: 0.8,
                xRange: { start: 'two', end: 'four' },
                yRange: { start: 20, end: 80 },
            },
        ],
    },
};

const STYLED = {
    ...NUMERIC,
    seriesArea: {
        backgroundRegions: [
            {
                fill: { type: 'gradient' as const, colorStops: [{ color: 'orangered' }, { color: 'lightsalmon' }] },
                fillOpacity: 0.8,
                stroke: 'crimson',
                strokeOpacity: 0.8,
                strokeWidth: 8,
                label: {
                    border: {
                        stroke: 'indigo',
                        strokeOpacity: 0.8,
                        strokeWidth: 4,
                    },
                    color: 'indigo',
                    cornerRadius: 8,
                    fill: { type: 'gradient' as const, colorStops: [{ color: 'mediumpurple' }, { color: 'thistle' }] },
                    fontSize: 14,
                    fontWeight: 'bold' as const,
                    padding: { top: 12, right: 20, bottom: 12, left: 20 },
                    position: 'inside' as const,
                    text: 'Styled Region',
                },
                xRange: { start: 20, end: 80 },
                yRange: { start: 20, end: 80 },
            },
        ],
    },
};

const THEMED: AgCartesianChartOptions = {
    ...NUMERIC,
    seriesArea: {
        backgroundRegions: [
            {
                xRange: { start: 20, end: 80 },
                yRange: { start: 20, end: 80 },
                label: {
                    text: 'Themed Region',
                },
            },
        ],
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
                            position: 'inside' as const,
                        },
                    },
                },
            },
        },
    },
};

const assertions = cartesianChartAssertions({ seriesTypes: ['scatter'], axisTypes: { x: 'number', y: 'number' } });

const EXAMPLES: Record<string, CartesianTestCase> = {
    NO_RANGES_NUMERIC: { options: NO_RANGES_NUMERIC, assertions },
    XRANGE_NUMERIC: { options: XRANGE_NUMERIC, assertions },
    YRANGE_NUMERIC: { options: YRANGE_NUMERIC, assertions },
    BOTH_RANGES_START_NUMERIC: { options: BOTH_RANGES_START_NUMERIC, assertions },
    BOTH_RANGES_END_NUMERIC: { options: BOTH_RANGES_END_NUMERIC, assertions },
    BOTH_RANGES_NUMERIC: { options: BOTH_RANGES_NUMERIC, assertions },
    OVERLAPPING_RANGES_NUMERIC: { options: OVERLAPPING_RANGES_NUMERIC, assertions },
    SECONDARY_AXIS_NUMERIC: {
        options: SECONDARY_AXIS_NUMERIC,
        assertions: cartesianChartAssertions({
            seriesTypes: ['scatter', 'scatter'],
            axisTypes: { x: 'number', y: 'number', __AXIS_ID_2: 'number' },
        }),
    },
    BOTH_RANGES_TIME: {
        options: BOTH_RANGES_TIME,
        assertions: cartesianChartAssertions({ seriesTypes: ['scatter'], axisTypes: { x: 'time', y: 'number' } }),
    },
    BOTH_RANGES_UNIT_TIME: {
        options: BOTH_RANGES_UNIT_TIME,
        assertions: cartesianChartAssertions({ seriesTypes: ['scatter'], axisTypes: { x: 'unit-time', y: 'number' } }),
    },
    BOTH_RANGES_ORDINAL_TIME: {
        options: BOTH_RANGES_ORDINAL_TIME,
        assertions: cartesianChartAssertions({
            seriesTypes: ['scatter'],
            axisTypes: { x: 'ordinal-time', y: 'number' },
        }),
    },
    BOTH_RANGES_CATEGORY: {
        options: BOTH_RANGES_CATEGORY,
        assertions: cartesianChartAssertions({ seriesTypes: ['bar'], axisTypes: { x: 'category', y: 'number' } }),
    },
    STYLED: { options: STYLED, assertions },
    THEMED: { options: THEMED, assertions },

    SERIES_AREA_PADDING_AND_BORDER: {
        options: {
            ...BOTH_RANGES_NUMERIC,
            seriesArea: {
                ...BOTH_RANGES_NUMERIC.seriesArea,
                padding: { top: 20, right: 20, bottom: 20, left: 20 },
                border: { enabled: true, strokeWidth: 4 },
            },
        },
        assertions,
    },

    INVALID_TYPE_VALUE: {
        options: {
            ...NUMERIC,
            seriesArea: {
                backgroundRegions: [
                    { fill: 'lightsalmon', fillOpacity: 0.8, xRange: { start: 'not-a-number', end: 80 } },
                ],
            },
        },
        assertions,
        warnings: [
            ['AG Charts - `seriesArea.backgroundRegions[0].xRange` does not match the axis type or domain, ignoring.'],
        ],
    },

    MISSING_CATEGORY_VALUE: {
        options: {
            ...CATEGORY,
            seriesArea: {
                backgroundRegions: [{ fill: 'lightsalmon', fillOpacity: 0.8, xRange: { start: 'two', end: 'nope' } }],
            },
        },
        assertions: cartesianChartAssertions({ seriesTypes: ['bar'], axisTypes: { x: 'category', y: 'number' } }),
        warnings: [
            ['AG Charts - `seriesArea.backgroundRegions[0].xRange` does not match the axis type or domain, ignoring.'],
        ],
    },

    UNKNOWN_AXIS_KEY: {
        options: {
            ...NUMERIC,
            seriesArea: {
                backgroundRegions: [
                    { fill: 'lightsalmon', fillOpacity: 0.8, yRange: { axis: 'nope', start: 20, end: 80 } },
                ],
            },
        },
        assertions,
        warnings: [
            [
                'AG Charts - No axis found matching `seriesArea.backgroundRegions[].yRange.axis` of `nope`, using the primary axis.',
            ],
        ],
    },

    ZERO_EXTENT: {
        options: {
            ...NUMERIC,
            seriesArea: {
                backgroundRegions: [{ fill: 'lightsalmon', fillOpacity: 0.8, xRange: { start: 50, end: 50 } }],
            },
        },
        assertions,
        warnings: [
            [
                'AG Charts - `seriesArea.backgroundRegions[0]` region has no width or height, ignoring. Check that `start` and `end` differ.',
            ],
        ],
    },

    LABEL_OUTSIDE_AT_PLOT_EDGE: {
        options: {
            ...NUMERIC,
            seriesArea: {
                backgroundRegions: [
                    {
                        fill: 'lightsalmon',
                        fillOpacity: 0.8,
                        label: { position: 'top', text: 'outside', fontSize: 20 },
                    },
                ],
            },
        },
        assertions,
    },

    ZOOMED_LABEL_STICKY: {
        options: {
            ...NUMERIC,
            zoom: { enabled: true, axes: 'xy' },
            initialState: { zoom: { ratioX: { start: 0.4, end: 0.6 }, ratioY: { start: 0.4, end: 0.6 } } },
            seriesArea: {
                backgroundRegions: [
                    {
                        fill: 'lightsalmon',
                        fillOpacity: 0.8,
                        xRange: { start: 20, end: 80 },
                        yRange: { start: 20, end: 80 },
                        label: { position: 'top', text: 'sticky', fontSize: 20 },
                    },
                ],
            },
        },
        assertions,
    },

    ZOOMED_LABEL_OUT_OF_VIEW: {
        options: {
            ...NUMERIC,
            zoom: { enabled: true, axes: 'xy' },
            initialState: { zoom: { ratioX: { start: 0.4, end: 0.6 }, ratioY: { start: 0.4, end: 0.6 } } },
            seriesArea: {
                backgroundRegions: [
                    {
                        fill: 'lightsalmon',
                        fillOpacity: 0.8,
                        xRange: { start: 0, end: 10 },
                        yRange: { start: 0, end: 10 },
                        label: { position: 'top', text: 'hidden', fontSize: 20 },
                    },
                ],
            },
        },
        assertions,
    },

    LABEL_OFFSET_INSIDE: {
        options: {
            ...NUMERIC,
            seriesArea: {
                backgroundRegions: [
                    {
                        fill: 'lightsalmon',
                        fillOpacity: 0.8,
                        xRange: { start: 20, end: 80 },
                        yRange: { start: 20, end: 80 },
                        label: {
                            position: 'inside-top-left',
                            text: 'offset',
                            fontSize: 20,
                            xOffset: 30,
                            yOffset: 60,
                        },
                    },
                ],
            },
        },
        assertions,
    },

    LABEL_OFFSET_NEGATIVE: {
        options: {
            ...NUMERIC,
            seriesArea: {
                backgroundRegions: [
                    {
                        fill: 'lightsalmon',
                        fillOpacity: 0.8,
                        xRange: { start: 20, end: 80 },
                        yRange: { start: 20, end: 80 },
                        label: {
                            position: 'inside-bottom-right',
                            text: 'offset',
                            fontSize: 20,
                            xOffset: -30,
                            yOffset: -60,
                        },
                    },
                ],
            },
        },
        assertions,
    },

    LABEL_OFFSET_AT_SERIES_AREA_EDGE: {
        options: {
            ...NUMERIC,
            seriesArea: {
                backgroundRegions: [
                    {
                        fill: 'lightsalmon',
                        fillOpacity: 0.8,
                        label: { position: 'top', text: 'outside', fontSize: 20, xOffset: 40, yOffset: 20 },
                    },
                ],
            },
        },
        assertions,
    },
};

const labelPositions = [
    'top',
    'left',
    'right',
    'bottom',
    'left-top',
    'right-top',
    'left-bottom',
    'right-bottom',
    'inside',
    'inside-left',
    'inside-right',
    'inside-top',
    'inside-bottom',
    'inside-top-left',
    'inside-bottom-left',
    'inside-top-right',
    'inside-bottom-right',
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
] as const;

const LONG_LABEL = 'A region label that is too long';

function fitLabelOptions(
    label: NonNullable<AgSeriesAreaBackgroundRegion['label']>,
    region?: Pick<AgSeriesAreaBackgroundRegion, 'xRange' | 'yRange'>
): AgCartesianChartOptions {
    return {
        ...NUMERIC,
        seriesArea: {
            backgroundRegions: [
                {
                    fill: 'lightsalmon',
                    fillOpacity: 0.8,
                    xRange: { start: 20, end: 80 },
                    yRange: { start: 20, end: 80 },
                    ...region,
                    label: { text: LONG_LABEL, fontSize: 20, position: 'inside-top', ...label },
                },
            ],
        },
    };
}

function fitRegion(
    x: number,
    y: number,
    label: NonNullable<AgSeriesAreaBackgroundRegion['label']>
): AgSeriesAreaBackgroundRegion {
    return {
        fill: 'lightsalmon',
        fillOpacity: 0.8,
        xRange: { start: x, end: x + 30 },
        yRange: { start: y, end: y + 45 },
        label: { text: LONG_LABEL, fontSize: 16, position: 'inside-top', ...label },
    };
}

EXAMPLES.LABEL_FIT_MODES = {
    options: {
        ...NUMERIC,
        seriesArea: {
            backgroundRegions: [
                fitRegion(0, 55, {}),
                fitRegion(35, 55, { wrapping: 'never', truncate: true }),
                fitRegion(70, 55, { maxWidth: 180, wrapping: 'never', minimumFontSize: 8 }),
                fitRegion(0, 0, { maxHeight: 20, minimumFontSize: 12 }),
                fitRegion(35, 0, { position: 'inside-left', rotation: 270 }),
                fitRegion(70, 0, { fill: 'white', border: { enabled: true, stroke: 'black' } }),
            ],
        },
        theme: { overrides: { scatter: { seriesArea: { backgroundRegions: { label: { maxWidth: 120 } } } } } },
    },
    assertions,
};

const narrowRegion = (x: number, y: number, label: NonNullable<AgSeriesAreaBackgroundRegion['label']>) => ({
    ...fitRegion(x, y, label),
    xRange: { start: x, end: x + 15 },
});

EXAMPLES.LABEL_REGION_BOUNDS = {
    options: {
        ...NUMERIC,
        seriesArea: {
            backgroundRegions: [
                narrowRegion(5, 55, {}),
                narrowRegion(40, 55, { position: 'bottom' }),
                narrowRegion(75, 55, { position: 'inside-left', rotation: 270, fontSize: 20 }),
                narrowRegion(5, 0, { maxWidth: 200 }),
                narrowRegion(40, 0, { position: 'inside', xOffset: 4 }),
                narrowRegion(75, 0, { fill: 'white', border: { enabled: true, stroke: 'black' } }),
            ],
        },
    },
    assertions,
};

const FIT_POSITIONS = [
    'top-left',
    'right',
    'left-bottom',
    'bottom',
    'inside',
    'inside-top-left',
    'inside-bottom-right',
] as const;

EXAMPLES.LABEL_FIT_POSITIONS = {
    options: {
        ...NUMERIC,
        seriesArea: {
            backgroundRegions: FIT_POSITIONS.map((position, index) => ({
                fill: 'lightsalmon',
                fillOpacity: index === 0 ? 0.8 : 0,
                xRange: { start: 30, end: 70 },
                yRange: { start: 30, end: 70 },
                label: { text: 'Wrapped region label', fontSize: 12, maxWidth: 70, position },
            })),
        },
    },
    assertions,
};

for (const position of labelPositions) {
    EXAMPLES[`LABEL_${position}`] = {
        options: {
            ...NUMERIC,
            seriesArea: {
                backgroundRegions: [
                    {
                        fill: 'lightsalmon',
                        fillOpacity: 0.8,
                        xRange: { start: 20, end: 80 },
                        yRange: { start: 20, end: 80 },
                        label: {
                            position,
                            text: position,
                            fontSize: 20,
                        },
                    },
                ],
            },
        },
        assertions,
    };
}

describe('Background Regions', () => {
    setupMockConsole();
    let chart: AgChartInstance;

    afterEach(async () => {
        if (chart != null) {
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
            chart = await createEnterpriseChart(example.options);
            await example.assertions(chart);

            expectWarningsCalls().toEqual(example.warnings ?? []);
        }
    );

    it.each(Object.entries(EXAMPLES))(
        'for %s it should render to canvas as expected',
        async (_exampleName, example) => {
            chart = await createEnterpriseChart(example.options);
            await compare();

            if (example.extraScreenshotActions) {
                await example.extraScreenshotActions(chart);
                await compare();
            }

            expectWarningsCalls().toEqual(example.warnings ?? []);
        }
    );
});

describe('Background Regions removal', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(async () => {
        if (chart != null) {
            await waitForChartStability(chart);
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    it('removes the regions when a full update omits backgroundRegions', async () => {
        const options: AgCartesianChartOptions = {
            ...NUMERIC,
            seriesArea: { backgroundRegions: [{ fill: 'lightsalmon', xRange: { start: 20, end: 80 } }] },
        };

        chart = await createEnterpriseChart(options);

        const regions = deproxy(chart).modulesManager.getModule<any>('background-regions');
        expect(regions.regions).toHaveLength(1);

        await chart.update(prepareEnterpriseTestOptions({ ...options, seriesArea: { clip: true } }));
        await waitForChartStability(chart);

        expect(regions.regions).toHaveLength(0);
        expectWarningsCalls().toEqual([]);
    });
});

describe('Background Region label fitting', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(async () => {
        if (chart != null) {
            await waitForChartStability(chart);
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    async function renderLabel(
        label: NonNullable<AgSeriesAreaBackgroundRegion['label']>,
        {
            theme,
            region,
            zoom,
        }: {
            theme?: AgCartesianChartOptions['theme'];
            region?: Pick<AgSeriesAreaBackgroundRegion, 'xRange' | 'yRange'>;
            zoom?: { start: number; end: number };
        } = {}
    ) {
        const options: AgCartesianChartOptions = { ...fitLabelOptions(label, region), theme };
        if (zoom) {
            options.zoom = { enabled: true, axes: 'xy' };
            options.initialState = { zoom: { ratioX: zoom, ratioY: zoom } };
        }

        chart = await createEnterpriseChart(options);
        expectWarningsCalls().toEqual([]);

        const regions = deproxy(chart).modulesManager.getModule<any>('background-regions');
        const { labelNode, regionGroup } = regions.regions[0].instance;
        return {
            text: labelNode.text as string,
            fontSize: labelNode.fontSize as number,
            width: labelNode.getBBox().width as number,
            box: getBackgroundRegionLabelBox(chart)!,
            regionBox: Transformable.toCanvas(regionGroup),
        };
    }

    it('renders a label that fits its region unchanged', async () => {
        expect(await renderLabel({})).toMatchObject({ text: LONG_LABEL, fontSize: 20 });
    });

    it('wraps onto multiple lines within maxWidth', async () => {
        const { text, fontSize, width } = await renderLabel({ maxWidth: 120, truncate: false });
        expect(text.split('\n').length).toBeGreaterThan(1);
        expect(text.replaceAll('\n', ' ')).toBe(LONG_LABEL);
        expect(fontSize).toBe(20);
        expect(width).toBeLessThanOrEqual(120);
    });

    it('truncates with an ellipsis', async () => {
        const { text, width } = await renderLabel({ maxWidth: 120, wrapping: 'never', truncate: true });
        expect(text).not.toContain('\n');
        expect(text.endsWith('…')).toBe(true);
        expect(width).toBeLessThanOrEqual(120);
    });

    it('shrinks towards minimumFontSize before truncating', async () => {
        const { text, fontSize, width } = await renderLabel({ maxWidth: 200, wrapping: 'never', minimumFontSize: 8 });
        expect(text).toBe(LONG_LABEL);
        expect(fontSize).toBeLessThan(20);
        expect(fontSize).toBeGreaterThanOrEqual(8);
        expect(width).toBeLessThanOrEqual(200);
    });

    it('truncates at minimumFontSize when the label still does not fit', async () => {
        const { text, fontSize, width } = await renderLabel({ maxWidth: 60, wrapping: 'never', minimumFontSize: 12 });
        expect(text.endsWith('…')).toBe(true);
        expect(fontSize).toBe(12);
        expect(width).toBeLessThanOrEqual(60);
    });

    it('fits a label bounded through a theme override', async () => {
        const theme = { overrides: { scatter: { seriesArea: { backgroundRegions: { label: { maxWidth: 120 } } } } } };
        const { text, width } = await renderLabel({}, { theme });
        expect(text.split('\n').length).toBeGreaterThan(1);
        expect(width).toBeLessThanOrEqual(120);
    });

    it('bounds a rotated label along its own text direction', async () => {
        const { text } = await renderLabel({ maxWidth: 120, truncate: false, position: 'inside-left', rotation: 270 });
        expect(text.split('\n').length).toBeGreaterThan(1);
        expect(text.replaceAll('\n', ' ')).toBe(LONG_LABEL);
    });

    const NARROW = { xRange: { start: 45, end: 55 }, yRange: { start: 20, end: 80 } };
    const SMALL = { xRange: { start: 45, end: 55 }, yRange: { start: 42, end: 58 } };
    const MEDIUM = { xRange: { start: 40, end: 60 }, yRange: { start: 20, end: 80 } };
    const SHORT = { xRange: { start: 20, end: 80 }, yRange: { start: 46, end: 54 } };

    it('wraps a label onto lines and truncates it to the region by default', async () => {
        const { text, box, regionBox: region } = await renderLabel({}, { region: SMALL });

        expect(text.split('\n').length).toBeGreaterThan(1);
        expect(text.endsWith('…')).toBe(true);
        expect(box.width).toBeLessThanOrEqual(region.width);
        expect(box.height).toBeLessThanOrEqual(region.height);
    });

    it.each(['inside', 'inside-top-left', 'inside-right', 'inside-bottom'] as const)(
        'holds an inside label at %s within the region',
        async (position) => {
            const { box, regionBox: region } = await renderLabel({ position }, { region: SMALL });

            const epsilon = 1e-6;
            expect(box.x).toBeGreaterThanOrEqual(region.x - epsilon);
            expect(box.y).toBeGreaterThanOrEqual(region.y - epsilon);
            expect(box.x + box.width).toBeLessThanOrEqual(region.x + region.width + epsilon);
            expect(box.y + box.height).toBeLessThanOrEqual(region.y + region.height + epsilon);
        }
    );

    it.each(['top', 'bottom', 'top-left', 'top-right', 'bottom-left', 'bottom-right'] as const)(
        'bounds a label at %s by the region width only',
        async (position) => {
            const { text, box, regionBox: region } = await renderLabel({ position }, { region: SMALL });

            expect(text.replaceAll('\n', ' ')).toBe(LONG_LABEL);
            expect(box.width).toBeLessThanOrEqual(region.width);
            expect(box.height).toBeGreaterThan(region.height);
        }
    );

    it.each(['left', 'right', 'left-top', 'left-bottom', 'right-top', 'right-bottom'] as const)(
        'bounds a label at %s by the region height only',
        async (position) => {
            const unrotated = await renderLabel({ position }, { region: SMALL });
            expect(unrotated.text).toBe(LONG_LABEL);
            expect(unrotated.box.width).toBeGreaterThan(unrotated.regionBox.width);

            chart.destroy();
            const rotated = await renderLabel({ position, rotation: 270 }, { region: SHORT });
            expect(rotated.text).not.toBe(LONG_LABEL);
            expect(rotated.box.height).toBeLessThanOrEqual(rotated.regionBox.height);
        }
    );

    it('bounds a rotated inside label along its turned footprint', async () => {
        const {
            text,
            box,
            regionBox: region,
        } = await renderLabel({ position: 'inside', rotation: 45 }, { region: NARROW });

        expect(text).not.toBe(LONG_LABEL);
        expect(box.width).toBeLessThanOrEqual(region.width);
    });

    it('replaces the region width with a larger maxWidth', async () => {
        const { text, box, regionBox: region } = await renderLabel({ maxWidth: 1000 }, { region: NARROW });

        expect(text).toBe(LONG_LABEL);
        expect(box.width).toBeGreaterThan(region.width);
    });

    it('replaces the region height with a larger maxHeight', async () => {
        const bounded = await renderLabel({}, { region: SMALL });
        chart.destroy();
        const { text, box, regionBox: region } = await renderLabel({ maxHeight: 1000 }, { region: SMALL });

        expect(text.split('\n').length).toBeGreaterThan(bounded.text.split('\n').length);
        expect(box.height).toBeGreaterThan(region.height);
    });

    it('frees the width bound for a label with an xOffset', async () => {
        const { text, box, regionBox: region } = await renderLabel({ xOffset: 1 }, { region: NARROW });

        expect(text).toBe(LONG_LABEL);
        expect(box.width).toBeGreaterThan(region.width);
    });

    it('frees the height bound for a label with a yOffset', async () => {
        const { text, box, regionBox: region } = await renderLabel({ yOffset: 1 }, { region: SMALL });

        expect(text.replaceAll('\n', ' ')).toBe(LONG_LABEL);
        expect(box.height).toBeGreaterThan(region.height);
    });

    it('reduces the bound by the spacing along the direction the label grows', async () => {
        const label: NonNullable<AgSeriesAreaBackgroundRegion['label']> & { spacing: number } = {
            position: 'inside-top-left',
            wrapping: 'never',
            spacing: 20,
        };
        const { box, regionBox: region } = await renderLabel(label, { region: NARROW });

        expect(box.x).toBeGreaterThanOrEqual(region.x + 20);
        expect(box.x + box.width).toBeLessThanOrEqual(region.x + region.width);
    });

    it('rewraps an inside label to the visible region under zoom', async () => {
        const unzoomed = await renderLabel({ position: 'inside' }, { region: NARROW });
        chart.destroy();
        const zoomed = await renderLabel({ position: 'inside' }, { region: NARROW, zoom: { start: 0.4, end: 0.6 } });

        expect(zoomed.text.split('\n').length).toBeLessThan(unzoomed.text.split('\n').length);
    });

    it('keeps a side label at its zoomed-out bound under zoom', async () => {
        const unzoomed = await renderLabel({ position: 'top' }, { region: MEDIUM });
        chart.destroy();
        const zoomed = await renderLabel({ position: 'top' }, { region: MEDIUM, zoom: { start: 0.4, end: 0.6 } });

        expect(unzoomed.text).not.toBe(LONG_LABEL);
        expect(zoomed.text).toBe(unzoomed.text);
    });
    it('rejects a minimumFontSize above fontSize', async () => {
        const options = fitLabelOptions({ maxWidth: 120, minimumFontSize: 30 });

        chart = await createEnterpriseChart(options);

        expectWarningsCalls().toEqual([
            [
                'AG Charts - Option `seriesArea.backgroundRegions[0].label.minimumFontSize` cannot be set to `30`; expecting a number greater than 0 and the value to be less than or equal to `fontSize`, ignoring.',
            ],
        ]);
    });
});

describe('Background Region label avoidance', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(async () => {
        if (chart != null) {
            await waitForChartStability(chart);
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    // Every datum shares a y value, so the series labels form one row across the region label.
    function avoidanceChart({
        seriesCollideWith,
        crossLinePlacement,
    }: {
        seriesCollideWith?: AgSeriesLabelCollideWithOptions;
        crossLinePlacement?: AgCartesianCrossLineLabelPlacement | AgCartesianCrossLineLabelPlacement[];
    }): AgCartesianChartOptions {
        const crossLines =
            crossLinePlacement == null
                ? undefined
                : [{ type: 'line' as const, value: 50, label: { text: 'CROSS LINE', placement: crossLinePlacement } }];
        return {
            data: Array.from({ length: 11 }, (_, i) => ({ x: i, y: 50 })),
            series: [
                {
                    type: 'line',
                    xKey: 'x',
                    yKey: 'y',
                    label: {
                        enabled: crossLinePlacement == null,
                        placement: ['bottom', 'top'],
                        collision: { collideWith: seriesCollideWith },
                    },
                },
            ],
            axes: {
                x: { type: 'number', position: 'bottom' },
                y: { type: 'number', position: 'left', min: 0, max: 100, crossLines },
            },
            seriesArea: {
                backgroundRegions: [{ label: { text: 'REGION LABEL', fontSize: 40, position: 'inside' } }],
            },
        };
    }

    function regionLabelBox() {
        const box = getBackgroundRegionLabelBox(chart);
        expect(box).toBeDefined();
        return box!;
    }

    function seriesLabelsOverlapping() {
        const region = regionLabelBox();
        const shown = getSeriesSelectionNodes(chart, 'labelSelection')
            .filter((node) => node.visible)
            .map((node) => Transformable.toCanvas(node));
        expect(shown.length).toBeGreaterThan(0);
        return shown.filter((box) => box.collidesBBox(region)).length;
    }

    it('keeps series labels clear of a region label unless they may overlap it', async () => {
        chart = await createEnterpriseChart(avoidanceChart({ seriesCollideWith: { regionLabels: true } }));
        const allowed = seriesLabelsOverlapping();
        await chart.update(prepareEnterpriseTestOptions(avoidanceChart({})));
        await waitForChartStability(chart);

        expect(allowed).toBeGreaterThan(0);
        expect(seriesLabelsOverlapping()).toBe(0);
    });

    it('moves a cross line label off a region label', async () => {
        const crossLineOverlaps = () => {
            const node = getCrossLineLabelNode(deproxy(chart).axes.findById('y')!);
            expect(node?.visible).toBe(true);
            return Transformable.toCanvas(node!).collidesBBox(regionLabelBox());
        };

        chart = await createEnterpriseChart(avoidanceChart({ crossLinePlacement: 'inside' }));
        const sole = crossLineOverlaps();
        await chart.update(
            prepareEnterpriseTestOptions(avoidanceChart({ crossLinePlacement: ['inside', 'inside-left'] }))
        );
        await waitForChartStability(chart);

        expect(sole).toBe(true);
        expect(crossLineOverlaps()).toBe(false);
    });
});

type DerivedAnchor = { regionH: number; regionV: number; labelH: number; labelV: number };

function axisDirection(position: string, negative: string, positive: string): number {
    if (position.includes(negative)) {
        return -1;
    }
    if (position.includes(positive)) {
        return 1;
    }
    return 0;
}

/**
 * The naming contract: for an outside position the first token is the side of the region the label
 * sits on (so on that axis the label is pushed out of the region) and the second is its alignment
 * along that side (so on the other axis the label matches the region). An `inside` label is flush
 * to both named edges.
 */
function deriveAnchor(position: string): DerivedAnchor {
    const regionH = axisDirection(position, 'left', 'right');
    const regionV = axisDirection(position, 'top', 'bottom');

    if (position.startsWith('inside')) {
        return { regionH, regionV, labelH: regionH, labelV: regionV };
    }

    const side = position.split('-')[0];
    const outwardIsHorizontal = side === 'left' || side === 'right';
    return {
        regionH,
        regionV,
        labelH: outwardIsHorizontal ? -regionH : regionH,
        labelV: outwardIsHorizontal ? regionV : -regionV,
    };
}

describe('Background Region label positions', () => {
    it('places every position where its own name says it should', () => {
        const expected: Record<string, DerivedAnchor> = {};
        const actual: Record<string, DerivedAnchor> = {};
        for (const [position, anchor] of Object.entries(anchors)) {
            expected[position] = deriveAnchor(position);
            actual[position] = anchor;
        }

        expect(actual).toEqual(expected);
    });
});

const REMOVED_LABEL_POSITIONS = ['top-left-above', 'top-right-above', 'bottom-left-below', 'bottom-right-below'];

describe('Background Region label position validation', () => {
    setupMockConsole();
    setupMockCanvas();

    it('rejects the removed -above / -below position names', async () => {
        for (const position of REMOVED_LABEL_POSITIONS) {
            const options: AgCartesianChartOptions = {
                ...NUMERIC,
                seriesArea: {
                    backgroundRegions: [
                        {
                            fill: 'lightsalmon',
                            xRange: { start: 20, end: 80 },
                            yRange: { start: 20, end: 80 },
                            label: { position: position as never, text: position },
                        },
                    ],
                },
            };

            const chart = await createEnterpriseChart(options);
            chart.destroy();
        }

        expectWarningsCalls().toMatchInlineSnapshot(`
          [
            [
              "AG Charts - Option \`seriesArea.backgroundRegions[0].label.position\` cannot be set to \`"top-left-above"\`; expecting a keyword such as 'top', 'left', 'right', 'bottom', 'left-top', 'right-top', 'left-bottom', 'right-bottom', 'inside', 'inside-left', 'inside-right', 'inside-top', 'inside-bottom', 'inside-top-left', 'inside-bottom-left', 'inside-top-right', 'inside-bottom-right', 'top-left', 'top-right', 'bottom-left' or 'bottom-right', ignoring.",
            ],
            [
              "AG Charts - Option \`seriesArea.backgroundRegions[0].label.position\` cannot be set to \`"top-right-above"\`; expecting a keyword such as 'top', 'left', 'right', 'bottom', 'left-top', 'right-top', 'left-bottom', 'right-bottom', 'inside', 'inside-left', 'inside-right', 'inside-top', 'inside-bottom', 'inside-top-left', 'inside-bottom-left', 'inside-top-right', 'inside-bottom-right', 'top-left', 'top-right', 'bottom-left' or 'bottom-right', ignoring.",
            ],
            [
              "AG Charts - Option \`seriesArea.backgroundRegions[0].label.position\` cannot be set to \`"bottom-left-below"\`; expecting a keyword such as 'top', 'left', 'right', 'bottom', 'left-top', 'right-top', 'left-bottom', 'right-bottom', 'inside', 'inside-left', 'inside-right', 'inside-top', 'inside-bottom', 'inside-top-left', 'inside-bottom-left', 'inside-top-right', 'inside-bottom-right', 'top-left', 'top-right', 'bottom-left' or 'bottom-right', ignoring.",
            ],
            [
              "AG Charts - Option \`seriesArea.backgroundRegions[0].label.position\` cannot be set to \`"bottom-right-below"\`; expecting a keyword such as 'top', 'left', 'right', 'bottom', 'left-top', 'right-top', 'left-bottom', 'right-bottom', 'inside', 'inside-left', 'inside-right', 'inside-top', 'inside-bottom', 'inside-top-left', 'inside-bottom-left', 'inside-top-right', 'inside-bottom-right', 'top-left', 'top-right', 'bottom-left' or 'bottom-right', ignoring.",
            ],
          ]
        `);
    });
});

describe('Background Regions on unsupported chart types', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(async () => {
        if (chart != null) {
            await waitForChartStability(chart);
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    it('reports the chart type rather than an unknown option', async () => {
        const options: AgChartOptions = {
            data: [
                { label: 'one', value: 20 },
                { label: 'two', value: 40 },
            ],
            series: [{ type: 'pie', angleKey: 'value', calloutLabelKey: 'label' }],
            seriesArea: {
                backgroundRegions: [{ fill: 'lightsalmon', xRange: { start: 20, end: 80 } }],
            },
        } as AgChartOptions;

        chart = await createEnterpriseChart(options);

        expectWarningsCalls().toEqual([
            ['AG Charts - Option `seriesArea.backgroundRegions` is not supported by `pie` series, ignoring.'],
        ]);
    });
});

describe('Background Regions under the enterprise registry', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(async () => {
        if (chart != null) {
            await waitForChartStability(chart);
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    it('emits no enterprise-feature warning', async () => {
        const options: AgCartesianChartOptions = {
            ...NUMERIC,
            seriesArea: { backgroundRegions: [{ fill: 'lightsalmon', xRange: { start: 20, end: 80 } }] },
        };

        chart = await createEnterpriseChart(options);

        expectWarningsCalls().toEqual([]);
    });
});

describe('Background Regions theme overrides', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(async () => {
        if (chart != null) {
            await waitForChartStability(chart);
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    it('applies nothing to a chart without background regions', async () => {
        const options: AgCartesianChartOptions = {
            data: [
                { x: 1, y: 1 },
                { x: 2, y: 2 },
            ],
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            theme: { overrides: { line: { seriesArea: { backgroundRegions: { fill: 'lightsalmon' } } } } },
        };

        chart = await createEnterpriseChart(options);

        expect(deproxy(chart).chartOptions.processedOptions.seriesArea ?? {}).not.toHaveProperty('backgroundRegions');
    });
});

describe('Background Region theme operators', () => {
    setupMockConsole();

    it('does not interpret a private theme operator in a region range', () => {
        const { processedOptions } = prepareProcessedOptions({
            title: { text: 'secret-title' },
            data: [{ x: 'a', y: 1 }],
            series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
            seriesArea: { backgroundRegions: [{ xRange: { start: { $path: '/title/text' } } }] },
        });

        expect(JSON.stringify(processedOptions.seriesArea)).not.toContain('secret-title');
        expectWarningsCalls().toEqual([[expect.stringContaining('Theme operators are only supported in themes')]]);
    });
});
