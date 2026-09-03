import { mapValues } from 'ag-charts-core';
import type { AgCartesianChartOptions, AgCartesianCrossLineOptions } from 'ag-charts-types';

import { DATA_MEAN_SEA_LEVEL } from '../../test/data';
import { loadExampleOptions } from '../../test/load-example';
import { DATA_OIL_PETROLEUM } from './data';

const GROUPED_BAR_CHART_EXAMPLE: AgCartesianChartOptions = loadExampleOptions('grouped-bar');
const GROUPED_COLUMN_EXAMPLE: AgCartesianChartOptions = loadExampleOptions('grouped-column');
const LINE_GRAPH_WITH_GAPS_EXAMPLE: AgCartesianChartOptions = loadExampleOptions('line-with-gaps');
const AREA_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE: AgCartesianChartOptions =
    loadExampleOptions('area-with-negative-values');

type CrossLinesRangeConfig = Record<string, { vertical: [Date, Date]; horizontal: [number, number] }>;
// Deliberately malformed cross-line options used to exercise validation warnings.
type InvalidCrossLineConfig = Record<string, Record<string, unknown>>;

const baseChartOptions: AgCartesianChartOptions = {
    data: DATA_OIL_PETROLEUM,
    theme: {
        overrides: {
            line: {
                series: {
                    highlight: {
                        highlightedSeries: {
                            strokeWidth: 3,
                        },
                        unhighlightedSeries: {
                            opacity: 0.2,
                        },
                    },
                },
            },
        },
    },
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'petrol',
            stroke: '#01c185',
            marker: {
                fill: '#01c185',
            },
        },
        {
            type: 'line',
            xKey: 'date',
            yKey: 'diesel',
            stroke: '#000000',
            marker: {
                fill: '#000000',
            },
        },
    ],
    axes: {
        x: {
            position: 'bottom',
            type: 'unit-time',
            title: {
                text: 'Date',
            },
        },
        y: {
            position: 'left',
            type: 'number',
            title: {
                text: 'Price in pence',
            },
        },
    },
};

const baseCrossLineOptions = {
    type: 'range',
    fill: '#dbddf0',
    stroke: '#5157b7',
    fillOpacity: 0.4,
    label: {
        text: 'Price Peak',
        color: 'black',
        fontSize: 14,
    },
};

const createChartOptions = (rangeConfig: CrossLinesRangeConfig): Record<string, AgCartesianChartOptions> => {
    const result: Record<string, AgCartesianChartOptions> = {};

    for (const name of Object.keys(rangeConfig)) {
        result[name] = {
            ...baseChartOptions,
            axes: mapValues(baseChartOptions['axes'] ?? {}, (axis) => {
                const range = axis.position === 'bottom' ? rangeConfig[name].vertical : rangeConfig[name].horizontal;
                return { ...axis, crossLines: [{ ...baseCrossLineOptions, range }] as AgCartesianCrossLineOptions[] };
            }),
        };
    }

    return result;
};

// Fill-free base: `fill`/`fillOpacity` are valid only on the `range` variant, so spreading them
// here would add unrelated "unknown option" warnings to the line cases.
const baseInvalidCrossLineOptions = {
    stroke: '#5157b7',
    label: {
        text: 'Price Peak',
        color: 'black',
        fontSize: 14,
    },
};

const createChartOptionsWithInvalidCrossLines = (
    config: InvalidCrossLineConfig
): Record<string, AgCartesianChartOptions> => {
    const result: Record<string, AgCartesianChartOptions> = {};

    for (const name of Object.keys(config)) {
        const invalidCrossLineOptions = config[name];
        result[name] = {
            ...baseChartOptions,
            axes: mapValues(baseChartOptions['axes'] ?? {}, (axis) => {
                return axis.position === 'left'
                    ? {
                          ...axis,
                          crossLines: [{ ...baseInvalidCrossLineOptions, ...invalidCrossLineOptions }] as any,
                      }
                    : axis;
            }),
        };
    }

    return result;
};

const crossLinesOptions: CrossLinesRangeConfig = {
    VALID_RANGE: {
        vertical: [new Date(Date.UTC(2019, 4, 1)), new Date(Date.UTC(2019, 7, 25))],
        horizontal: [128, 134],
    },
    INVALID_RANGE: {
        vertical: [new Date(Date.UTC(2019, 4, 1)), undefined!],
        horizontal: [128, undefined!],
    },
    RANGE_OUTSIDE_DOMAIN_MAX: {
        vertical: [new Date(Date.UTC(2019, 4, 1)), new Date(Date.UTC(2022, 7, 25))],
        horizontal: [134, 160],
    },
    RANGE_OUTSIDE_DOMAIN_MIN: {
        vertical: [new Date(Date.UTC(2017, 7, 25)), new Date(Date.UTC(2019, 4, 1))],
        horizontal: [100, 134],
    },
    RANGE_OUTSIDE_DOMAIN_MIN_MAX: {
        vertical: [new Date(Date.UTC(2017, 7, 25)), new Date(Date.UTC(2022, 4, 1))],
        horizontal: [100, 160],
    },
    RANGE_OUTSIDE_DOMAIN: {
        vertical: [new Date(Date.UTC(2022, 4, 1)), new Date(Date.UTC(2022, 7, 25))],
        horizontal: [90, 110],
    },
};

const invalidCrossLinesOptions: InvalidCrossLineConfig = {
    INVALID_RANGE_VALUE_CROSSLINE: {
        type: 'range',
        range: [undefined, 134],
    },
    INVALID_RANGE_LENGTH_CROSSLINE: {
        type: 'range',
        range: [128, 134, 135],
    },
    INVALID_RANGE_WITHOUT_TYPE_CROSSLINE: {
        range: [128, 134],
    },
    INVALID_RANGE_WITH_LINE_TYPE_CROSSLINE: {
        type: 'line',
        range: [128, 134],
    },
    INVALID_LINE_VALUE_CROSSLINES: {
        type: 'line',
        value: 'a string instead of number',
    },
    INVALID_LINE_WITHOUT_TYPE_CROSSLINE: {
        value: 128,
    },
    INVALID_LINE_WITH_RANGE_TYPE_CROSSLINE: {
        type: 'range',
        value: 128,
    },
    INVALID_FILL_ON_LINE_TYPE_CROSSLINE: {
        type: 'line',
        value: 128,
        fill: '#dbddf0',
        fillOpacity: 0.4,
    },
};

const crossLineLabelPositionOptions: CrossLinesRangeConfig = {
    LABEL: {
        ...crossLinesOptions.VALID_RANGE,
    },
};

const chartOptions: Record<string, AgCartesianChartOptions> = createChartOptions({
    ...crossLinesOptions,
    ...crossLineLabelPositionOptions,
});

const invalidChartOptions: Record<string, AgCartesianChartOptions> =
    createChartOptionsWithInvalidCrossLines(invalidCrossLinesOptions);

export const VALID_RANGE_CROSSLINES: AgCartesianChartOptions = chartOptions['VALID_RANGE'];
export const RANGE_OUTSIDE_DOMAIN_MAX_CROSSLINES: AgCartesianChartOptions = chartOptions['RANGE_OUTSIDE_DOMAIN_MAX'];
export const RANGE_OUTSIDE_DOMAIN_MIN_CROSSLINES: AgCartesianChartOptions = chartOptions['RANGE_OUTSIDE_DOMAIN_MIN'];
export const RANGE_OUTSIDE_DOMAIN_MIN_MAX_CROSSLINES: AgCartesianChartOptions =
    chartOptions['RANGE_OUTSIDE_DOMAIN_MIN_MAX'];
export const RANGE_OUTSIDE_DOMAIN_CROSSLINES: AgCartesianChartOptions = chartOptions['RANGE_OUTSIDE_DOMAIN'];

export const INVALID_RANGE_VALUE_CROSSLINE: AgCartesianChartOptions =
    invalidChartOptions['INVALID_RANGE_VALUE_CROSSLINE'];
export const INVALID_RANGE_LENGTH_CROSSLINE: AgCartesianChartOptions =
    invalidChartOptions['INVALID_RANGE_LENGTH_CROSSLINE'];
export const INVALID_RANGE_WITHOUT_TYPE_CROSSLINE: AgCartesianChartOptions =
    invalidChartOptions['INVALID_RANGE_WITHOUT_TYPE_CROSSLINE'];
export const INVALID_LINE_VALUE_CROSSLINES = invalidChartOptions['INVALID_LINE_VALUE_CROSSLINES'];
export const INVALID_RANGE_WITH_LINE_TYPE_CROSSLINE = invalidChartOptions['INVALID_RANGE_WITH_LINE_TYPE_CROSSLINE'];
export const INVALID_LINE_WITHOUT_TYPE_CROSSLINE = invalidChartOptions['INVALID_LINE_WITHOUT_TYPE_CROSSLINE'];
export const INVALID_LINE_WITH_RANGE_TYPE_CROSSLINE = invalidChartOptions['INVALID_LINE_WITH_RANGE_TYPE_CROSSLINE'];
export const INVALID_FILL_ON_LINE_TYPE_CROSSLINE = invalidChartOptions['INVALID_FILL_ON_LINE_TYPE_CROSSLINE'];

export const DEFAULT_LABEL_POSITION_CROSSLINES: AgCartesianChartOptions = chartOptions['LABEL'];

// `fill`/`fillOpacity` are valid on the `range` variant only, so line cross-lines use the
// stroke-only variants to avoid "unknown option" warnings.
const xAxisLineCrossLineStyle = {
    stroke: 'green',
    strokeWidth: 1,
};

const yAxisLineCrossLineStyle = {
    stroke: 'red',
    strokeWidth: 1,
};

const xAxisCrossLineStyle = {
    ...xAxisLineCrossLineStyle,
    fill: 'rgba(0,118,0,0.5)',
    fillOpacity: 0.2,
};

const yAxisCrossLineStyle = {
    ...yAxisLineCrossLineStyle,
    fill: 'pink',
    fillOpacity: 0.2,
};

export const SCATTER_CROSSLINES: AgCartesianChartOptions = {
    title: {
        text: 'Mean Sea Level (mm)',
    },
    data: DATA_MEAN_SEA_LEVEL,
    series: [
        {
            type: 'scatter',
            xKey: 'time',
            yKey: 'mm',
        },
    ],
    axes: {
        y: {
            position: 'left',
            type: 'number',
            crossLines: [
                {
                    type: 'range',
                    range: [10, 30],
                    label: {
                        text: '10 - 30',
                        position: 'right',
                    },
                    ...yAxisCrossLineStyle,
                },
                {
                    type: 'line',
                    value: 60,
                    label: {
                        text: '60',
                        position: 'right',
                    },
                    ...yAxisLineCrossLineStyle,
                },
            ],
        },
        x: {
            position: 'bottom',
            type: 'number',
            crossLines: [
                {
                    type: 'range',
                    range: [2001, 2003],
                    label: {
                        text: '2001 - 2003',
                    },
                    ...xAxisCrossLineStyle,
                },
                {
                    type: 'range',
                    range: [2013, 2014],
                    label: {
                        text: '2013 - 20014',
                    },
                    ...xAxisCrossLineStyle,
                },
                {
                    type: 'line',
                    value: 2008,
                    label: {
                        text: '2008',
                    },
                    ...xAxisLineCrossLineStyle,
                },
            ],
        },
    },
    legend: {
        enabled: true,
        position: 'right',
    },
};

export const LINE_CROSSLINES: AgCartesianChartOptions = {
    ...LINE_GRAPH_WITH_GAPS_EXAMPLE,
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
            title: {
                text: 'Week',
            },
            label: {
                formatter: (params) => (params.index % 3 ? '' : params.value),
            },
            crossLines: [
                {
                    type: 'range',
                    range: [1, 13],
                    label: {
                        text: '1 - 13',
                        position: 'top',
                    },
                    ...xAxisCrossLineStyle,
                },
                {
                    type: 'range',
                    range: [34, 45],
                    label: {
                        text: '34 - 45',
                        position: 'top',
                    },
                    ...xAxisCrossLineStyle,
                },
                {
                    type: 'line',
                    value: 27,
                    label: {
                        text: '27',
                        position: 'top',
                    },
                    ...xAxisLineCrossLineStyle,
                },
            ],
        },
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: '£ per kg',
            },
            nice: false,
            min: 0.2,
            max: 1,
            crossLines: [
                {
                    type: 'range',
                    range: [0.25, 0.33],
                    label: {
                        text: '0.25 - 0.33',
                        position: 'inside-left',
                        padding: 10,
                    },
                    ...yAxisCrossLineStyle,
                },
                {
                    type: 'line',
                    value: 0.87,
                    label: {
                        text: '0.87',
                        position: 'top-right',
                    },
                    ...yAxisLineCrossLineStyle,
                },
            ],
        },
    },
};

export const AREA_CROSSLINES: AgCartesianChartOptions = {
    ...AREA_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
            crossLines: [
                {
                    type: 'range',
                    range: ['Q1', 'Q2'],
                    label: {
                        text: 'Q1 - Q2',
                    },
                    ...xAxisCrossLineStyle,
                },
                {
                    type: 'range',
                    range: ['Q3', 'Q4'],
                    label: {
                        text: 'Q3 - Q4',
                    },
                    ...xAxisCrossLineStyle,
                },
            ],
        },
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: 'Thousand tonnes of oil equivalent',
            },
            crossLines: [
                {
                    type: 'range',
                    range: [800, 1000],
                    label: {
                        text: '800 - 1000',
                        position: 'inside-bottom-left',
                    },
                    ...yAxisCrossLineStyle,
                },
                {
                    type: 'line',
                    value: -700,
                    label: {
                        text: '-700',
                        position: 'top-left',
                    },
                    ...yAxisLineCrossLineStyle,
                },
            ],
        },
    },
};

export const COLUMN_CROSSLINES: AgCartesianChartOptions = {
    ...GROUPED_COLUMN_EXAMPLE,
    axes: {
        x: {
            position: 'bottom',
            type: 'category',
            crossLines: [
                {
                    type: 'range',
                    range: ['2015', '2016'],
                    label: {
                        text: '2015 - 2016',
                    },
                    ...xAxisCrossLineStyle,
                },
                {
                    type: 'range',
                    range: ['2017', '2019'],
                    label: {
                        text: '2017 - 2019',
                    },
                    ...xAxisCrossLineStyle,
                },
                {
                    type: 'line',
                    value: '2012',
                    label: {
                        text: '2012',
                    },
                    ...xAxisLineCrossLineStyle,
                },
            ],
        },
        y: {
            position: 'left',
            type: 'number',
            crossLines: [
                {
                    type: 'range',
                    range: [7000, 8000],
                    label: {
                        text: '7000 - 8000',
                        position: 'right',
                        rotation: -90,
                    },
                    ...yAxisCrossLineStyle,
                },
                {
                    type: 'line',
                    value: 3500,
                    label: {
                        text: '3500',
                        position: 'right',
                        rotation: -90,
                    },
                    ...yAxisLineCrossLineStyle,
                },
            ],
        },
    },
};

export const BAR_CROSSLINES: AgCartesianChartOptions = {
    ...GROUPED_BAR_CHART_EXAMPLE,
    axes: {
        y: {
            position: 'left',
            type: 'category',
            crossLines: [
                {
                    type: 'range',
                    range: ['Whole economy', 'Public sector'],
                    label: {
                        text: 'Whole economy - Public sector',
                        position: 'right',
                        rotation: -90,
                    },
                    ...yAxisCrossLineStyle,
                },
                {
                    type: 'line',
                    value: 'Manufacturing',
                    label: {
                        text: 'Manufacturing',
                        position: 'right',
                        rotation: -90,
                    },
                    ...yAxisLineCrossLineStyle,
                },
            ],
        },
        x: {
            position: 'bottom',
            type: 'number',
            crossLines: [
                {
                    type: 'range',
                    range: [0.5, 1.4],
                    label: {
                        text: '0.5 - 1.4',
                    },
                    ...xAxisCrossLineStyle,
                },
                {
                    type: 'range',
                    range: [2.3, 2.5],
                    label: {
                        text: '2.3 - 2.5',
                    },
                    ...xAxisCrossLineStyle,
                },
                {
                    type: 'line',
                    value: 3.6,
                    label: {
                        text: '3.6',
                    },
                    ...xAxisLineCrossLineStyle,
                },
            ],
        },
    },
};

// Dual-axis examples: crosslines on secondary/stacked axes.

const dualAxisData = DATA_OIL_PETROLEUM.map((d) => ({
    ...d,
    volume: d.petrol * 10,
}));

const dualAxisSeries: AgCartesianChartOptions['series'] = [
    {
        type: 'line',
        xKey: 'date',
        yKey: 'petrol',
        stroke: '#01c185',
    },
    {
        type: 'line',
        xKey: 'date',
        yKey: 'volume',
        yKeyAxis: 'ySecondary',
        stroke: '#000000',
    },
];

export const DUAL_LEFT_AXES_CROSSLINE_LINE: AgCartesianChartOptions = {
    data: dualAxisData,
    series: dualAxisSeries,
    axes: {
        x: { position: 'bottom', type: 'unit-time' },
        y: {
            position: 'left',
            type: 'number',
            title: { text: 'Price' },
            crossLines: [
                {
                    type: 'line',
                    value: 130,
                    label: { text: 'Price threshold', position: 'right' },
                    ...yAxisLineCrossLineStyle,
                },
            ],
        },
        ySecondary: { position: 'left', type: 'number', title: { text: 'Volume' } },
    },
};

export const DUAL_LEFT_AXES_CROSSLINE_RANGE: AgCartesianChartOptions = {
    data: dualAxisData,
    series: dualAxisSeries,
    axes: {
        x: { position: 'bottom', type: 'unit-time' },
        y: {
            position: 'left',
            type: 'number',
            title: { text: 'Price' },
            crossLines: [
                {
                    type: 'range',
                    range: [128, 134],
                    label: { text: '128 - 134', position: 'inside-top' },
                    ...yAxisCrossLineStyle,
                },
            ],
        },
        ySecondary: { position: 'left', type: 'number', title: { text: 'Volume' } },
    },
};

export const LEFT_RIGHT_AXES_CROSSLINE: AgCartesianChartOptions = {
    data: dualAxisData,
    series: dualAxisSeries,
    axes: {
        x: { position: 'bottom', type: 'unit-time' },
        y: { position: 'left', type: 'number', title: { text: 'Price' } },
        ySecondary: {
            position: 'right',
            type: 'number',
            title: { text: 'Volume' },
            crossLines: [
                {
                    type: 'line',
                    value: 1300,
                    label: { text: 'Volume threshold', position: 'left' },
                    ...yAxisLineCrossLineStyle,
                },
                {
                    type: 'range',
                    range: [1280, 1340],
                    label: { text: '1280 - 1340', position: 'inside-top' },
                    ...yAxisCrossLineStyle,
                },
            ],
        },
    },
};

export const DUAL_RIGHT_AXES_CROSSLINE: AgCartesianChartOptions = {
    data: dualAxisData,
    series: dualAxisSeries,
    axes: {
        x: { position: 'bottom', type: 'unit-time' },
        y: {
            position: 'right',
            type: 'number',
            title: { text: 'Price' },
            crossLines: [
                {
                    type: 'line',
                    value: 130,
                    label: { text: 'Price threshold', position: 'left' },
                    ...yAxisLineCrossLineStyle,
                },
            ],
        },
        ySecondary: { position: 'right', type: 'number', title: { text: 'Volume' } },
    },
};

export const DUAL_BOTTOM_AXES_CROSSLINE: AgCartesianChartOptions = {
    data: DATA_OIL_PETROLEUM,
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'petrol',
            stroke: '#01c185',
        },
        {
            type: 'line',
            xKey: 'date',
            xKeyAxis: 'xSecondary',
            yKey: 'diesel',
            stroke: '#000000',
        },
    ],
    axes: {
        x: {
            position: 'bottom',
            type: 'unit-time',
            title: { text: 'Date (primary)' },
            crossLines: [
                {
                    type: 'line',
                    value: new Date(2019, 6, 1),
                    label: { text: 'Jul 2019', position: 'top' },
                    ...xAxisLineCrossLineStyle,
                },
            ],
        },
        xSecondary: { position: 'bottom', type: 'unit-time', title: { text: 'Date (secondary)' } },
        y: { position: 'left', type: 'number' },
    },
};

/**
 * `nice: false`, and explicit `min`/`max`, pin a continuous axis's domain to the data extremes, so a
 * cross line on either extreme converts to exactly the pixel boundary cross lines are culled against.
 * The number axis sits alongside the time axis because nothing about that boundary is time-specific.
 */
export const DOMAIN_EXTREME_LINE_CROSSLINES: AgCartesianChartOptions = {
    data: [
        { date: new Date(Date.UTC(2024, 0, 1)), value: 2 },
        { date: new Date(Date.UTC(2024, 1, 1)), value: 5 },
        { date: new Date(Date.UTC(2024, 2, 1)), value: 3 },
        { date: new Date(Date.UTC(2024, 3, 1)), value: 1 },
        { date: new Date(Date.UTC(2024, 4, 1)), value: 2 },
        { date: new Date(Date.UTC(2024, 5, 1)), value: 3 },
        { date: new Date(Date.UTC(2024, 9, 1)), value: 1 },
        { date: new Date(Date.UTC(2024, 10, 1)), value: 2 },
        { date: new Date(Date.UTC(2024, 11, 1)), value: 2 },
    ],
    series: [{ type: 'line', xKey: 'date', yKey: 'value' }],
    axes: {
        x: {
            position: 'bottom',
            type: 'time',
            nice: false,
            crossLines: [
                {
                    type: 'line',
                    value: new Date(Date.UTC(2024, 0, 1)),
                    label: { text: 'First', position: 'top' },
                    ...xAxisLineCrossLineStyle,
                },
                {
                    type: 'line',
                    value: new Date(Date.UTC(2024, 1, 1)),
                    label: { text: 'Second', position: 'top' },
                    ...xAxisLineCrossLineStyle,
                },
                {
                    type: 'line',
                    value: new Date(Date.UTC(2024, 11, 1)),
                    label: { text: 'Last', position: 'top' },
                    ...xAxisLineCrossLineStyle,
                },
            ],
        },
        y: {
            position: 'left',
            type: 'number',
            min: 1,
            max: 5,
            crossLines: [
                { type: 'line', value: 1, label: { text: 'Min', position: 'right' }, ...yAxisLineCrossLineStyle },
                { type: 'line', value: 3, label: { text: 'Mid', position: 'right' }, ...yAxisLineCrossLineStyle },
                { type: 'line', value: 5, label: { text: 'Max', position: 'right' }, ...yAxisLineCrossLineStyle },
            ],
        },
    },
};

/**
 * The counterpart to {@link DOMAIN_EXTREME_LINE_CROSSLINES}: the same chart with every cross line
 * moved just outside the domain, where none of them may draw. Clamping puts an out-of-domain value on
 * the same pixel as one on the extreme, so this is what stops a fix for the former reaching too far.
 */
export const OUTSIDE_DOMAIN_LINE_CROSSLINES: AgCartesianChartOptions = {
    ...DOMAIN_EXTREME_LINE_CROSSLINES,
    axes: {
        x: {
            position: 'bottom',
            type: 'time',
            nice: false,
            crossLines: [
                {
                    type: 'line',
                    value: new Date(Date.UTC(2023, 11, 1)),
                    label: { text: 'Before first', position: 'top' },
                    ...xAxisLineCrossLineStyle,
                },
                {
                    type: 'line',
                    value: new Date(Date.UTC(2025, 0, 1)),
                    label: { text: 'After last', position: 'top' },
                    ...xAxisLineCrossLineStyle,
                },
            ],
        },
        y: {
            position: 'left',
            type: 'number',
            min: 1,
            max: 5,
            crossLines: [
                { type: 'line', value: 0, label: { text: 'Below min', position: 'right' }, ...yAxisLineCrossLineStyle },
                { type: 'line', value: 6, label: { text: 'Above max', position: 'right' }, ...yAxisLineCrossLineStyle },
            ],
        },
    },
};
