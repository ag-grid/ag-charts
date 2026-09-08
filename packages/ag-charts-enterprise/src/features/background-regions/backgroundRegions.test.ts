import { describe } from 'vitest';

import { AgCharts } from 'ag-charts-community';
import {
    type CartesianTestCase,
    cartesianChartAssertions,
    compareImageSnapshot,
    deproxy,
    expectWarningsCalls,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import type { AgCartesianChartOptions, AgChartOptions } from 'ag-charts-types';

import { prepareEnterpriseTestOptions } from '../../test/utils';
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
            const options: AgCartesianChartOptions = { ...example.options };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            await example.assertions(chart);

            expectWarningsCalls().toEqual(example.warnings ?? []);
        }
    );

    it.each(Object.entries(EXAMPLES))(
        'for %s it should render to canvas as expected',
        async (_exampleName, example) => {
            const options: AgCartesianChartOptions = { ...example.options };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
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

    let chart: any;

    afterEach(async () => {
        if (chart) {
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
        prepareEnterpriseTestOptions(options);

        chart = AgCharts.create(options);
        await waitForChartStability(chart);

        const seriesArea = deproxy(chart).seriesArea as any;
        expect(seriesArea.instances).toHaveLength(1);

        await chart.update({ ...options, seriesArea: { clip: true } });
        await waitForChartStability(chart);

        expect(seriesArea.instances).toHaveLength(0);
        expectWarningsCalls().toEqual([]);
    });
});

type DerivedAnchor = { regionH: number; regionV: number; labelH: number; labelV: number };

/**
 * The naming contract: for an outside position the first token is the side of the region the label
 * sits on (so on that axis the label is pushed out of the region) and the second is its alignment
 * along that side (so on the other axis the label matches the region). An `inside` label is flush
 * to both named edges.
 */
function axisDirection(position: string, negative: string, positive: string): number {
    if (position.includes(negative)) {
        return -1;
    }
    if (position.includes(positive)) {
        return 1;
    }
    return 0;
}

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
            prepareEnterpriseTestOptions(options);

            const chart = AgCharts.create(options);
            await waitForChartStability(chart);
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

    let chart: any;

    afterEach(async () => {
        if (chart) {
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
        prepareEnterpriseTestOptions(options);

        chart = AgCharts.create(options);
        await waitForChartStability(chart);

        expectWarningsCalls().toEqual([
            ['AG Charts - Option `seriesArea.backgroundRegions` is not supported by `pie` series, ignoring.'],
        ]);
    });
});

describe('Background Regions under the enterprise registry', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: any;

    afterEach(async () => {
        if (chart) {
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
        prepareEnterpriseTestOptions(options);

        chart = AgCharts.create(options);
        await waitForChartStability(chart);

        expectWarningsCalls().toEqual([]);
    });
});
