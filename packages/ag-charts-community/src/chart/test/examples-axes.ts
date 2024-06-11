import type { AgCartesianChartOptions } from '../../options/agChartOptions';
import day from '../../util/time/day';
import { DATA_TOTAL_GAME_WINNINGS_GROUPED_BY_COUNTRY_EXTENDED } from './data';
import * as data from './data-axes';
import * as examples from './examples';

export const CATEGORY_AXIS_BASIC_EXAMPLE: AgCartesianChartOptions = {
    data: data.DATA_COUNTRY_DIETARY_STATS,
    axes: [
        { type: 'category', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
    series: [
        {
            xKey: 'country',
            xName: 'Country',
            yKey: 'sugar',
            yName: 'Sugar',
            grouped: true,
            type: 'bar',
        },
        {
            xKey: 'country',
            xName: 'Country',
            yKey: 'fat',
            yName: 'Fat',
            grouped: true,
            type: 'bar',
        },
        {
            xKey: 'country',
            xName: 'Country',
            yKey: 'weight',
            yName: 'Weight',
            grouped: true,
            type: 'bar',
        },
    ],
};

export const CATEGORY_AXIS_UNIFORM_BASIC_EXAMPLE: AgCartesianChartOptions = {
    data: data.DATA_YOUTUBE_VIDEOS_STATS_BY_DAY_OF_YEAR,
    axes: [
        { type: 'category', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
    series: [
        {
            xKey: 'day',
            xName: 'Day',
            yKey: 'likes',
            yName: 'Likes',
            type: 'bar',
        },
    ],
};

export const TIME_AXIS_BASIC_EXAMPLE: AgCartesianChartOptions = {
    data: data.DATA_YOUTUBE_VIDEOS_STATS_BY_DATE,
    axes: [
        { type: 'time', position: 'bottom', interval: { step: day.every(7, { snapTo: 'start' }) } },
        { type: 'number', position: 'left' },
    ],
    series: [
        {
            xKey: 'date',
            xName: 'Day',
            yKey: 'likes',
            yName: 'Likes',
            type: 'line',
        },
    ],
};

export const TIME_AXIS_MIN_MAX_DATE_EXAMPLE: AgCartesianChartOptions = {
    ...TIME_AXIS_BASIC_EXAMPLE,
    axes: [
        {
            type: 'time',
            position: 'bottom',
            min: new Date(2022, 1, 15, 0, 0, 0),
            max: new Date(2022, 2, 15, 0, 0, 0),
            interval: { step: day.every(3, { snapTo: 'start' }) },
        },
        { type: 'number', position: 'left' },
    ],
};

export const TIME_AXIS_MIN_MAX_NUMBER_EXAMPLE: AgCartesianChartOptions = {
    ...TIME_AXIS_MIN_MAX_DATE_EXAMPLE,
    axes: [
        {
            type: 'time',
            position: 'bottom',
            min: new Date(2022, 1, 15, 0, 0, 0).getTime(),
            max: new Date(2022, 2, 15, 0, 0, 0).getTime(),
            interval: { step: day.every(3, { snapTo: 'start' }) },
        },
        { type: 'number', position: 'left' },
    ],
};

export const NUMBER_AXIS_UNIFORM_BASIC_EXAMPLE: AgCartesianChartOptions = {
    data: data.DATA_YOUTUBE_VIDEOS_STATS_BY_DAY_OF_YEAR,
    axes: [
        { type: 'number', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
    series: [
        {
            xKey: 'day',
            xName: 'Day',
            yKey: 'likes',
            yName: 'Likes',
            type: 'line',
        },
    ],
};

export const LOG10_SMALL_DOMAIN_NICE_FALSE_EXAMPLE: AgCartesianChartOptions = {
    ...NUMBER_AXIS_UNIFORM_BASIC_EXAMPLE,
    data: [
        {
            day: 1,
            likes: 200,
            subscribes: 184,
            comments: 182,
        },
        {
            day: 2,
            likes: 185,
            subscribes: 185,
            comments: 182,
        },
        {
            day: 3,
            likes: 182,
            subscribes: 182,
            comments: 180,
        },
    ],
    axes: [
        { type: 'number', position: 'bottom' },
        { type: 'log', position: 'left', base: 10, label: { format: '.0f' }, nice: false },
    ],
};

export const NUMBER_AXIS_LOG10_EXAMPLE: AgCartesianChartOptions = {
    ...NUMBER_AXIS_UNIFORM_BASIC_EXAMPLE,
    data: data.DATA_YOUTUBE_VIDEOS_STATS_BY_DAY_OF_YEAR_LARGE_SCALE,
    axes: [
        { type: 'number', position: 'bottom' },
        { type: 'log', position: 'left', base: 10, label: { format: '.0f' } },
    ],
};

export const NUMBER_AXIS_LOG2_EXAMPLE: AgCartesianChartOptions = {
    ...NUMBER_AXIS_UNIFORM_BASIC_EXAMPLE,
    data: data.DATA_YOUTUBE_VIDEOS_STATS_BY_DAY_OF_YEAR_LARGE_SCALE,
    axes: [
        { type: 'number', position: 'bottom' },
        { type: 'log', position: 'left', base: 2, label: { format: '.0f' } },
    ],
};

export const GROUPED_CATEGORY_AXIS_EXAMPLE: AgCartesianChartOptions = {
    ...examples.GROUPED_CATEGORY_AXIS_EXAMPLE,
    data: DATA_TOTAL_GAME_WINNINGS_GROUPED_BY_COUNTRY_EXTENDED.slice(0, 20),
};

export const NUMBER_AXIS_NO_SERIES: AgCartesianChartOptions = {
    ...examples.SIMPLE_SCATTER_CHART_EXAMPLE,
    series: examples.SIMPLE_SCATTER_CHART_EXAMPLE.series?.map((s) => ({ ...s, visible: false })),
    legend: { enabled: false },
};

export const NUMBER_AXIS_TICK_VALUES: AgCartesianChartOptions = {
    ...examples.SIMPLE_SCATTER_CHART_EXAMPLE,
    axes: [
        { type: 'number', position: 'bottom', interval: { values: [142, 153, 203, 220, 290] } },
        { type: 'number', position: 'left' },
    ],
};

export const TIME_AXIS_TICK_VALUES: AgCartesianChartOptions = {
    ...examples.ADV_TIME_AXIS_WITH_IRREGULAR_INTERVALS,
    axes: [
        {
            type: 'time',
            position: 'bottom',
            interval: {
                values: [new Date(2020, 0, 1), new Date(2020, 0, 4), new Date(2020, 0, 17), new Date(2020, 0, 28)],
            },
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
};

export const LOG_AXIS_TICK_VALUES: AgCartesianChartOptions = {
    ...NUMBER_AXIS_UNIFORM_BASIC_EXAMPLE,
    axes: [
        { type: 'number', position: 'bottom' },
        {
            type: 'log',
            position: 'left',
            interval: {
                values: [2, 4, 8, 16, 12, 20, 200, 400, 800],
            },
        },
    ],
};

export const CATEGORY_AXIS_TICK_VALUES: AgCartesianChartOptions = {
    ...examples.GROUPED_COLUMN_EXAMPLE,
    axes: [
        {
            type: 'category',
            position: 'bottom',
            interval: {
                values: ['2016', '2018'],
            },
        },
        { type: 'number', position: 'left' },
    ],
};

export const AXIS_TICK_MIN_SPACING: AgCartesianChartOptions = {
    ...examples.ADV_TIME_AXIS_WITH_IRREGULAR_INTERVALS,
    axes: [
        {
            type: 'time',
            position: 'bottom',
            interval: { minSpacing: 200 },
        },
        {
            type: 'number',
            position: 'left',
            interval: { minSpacing: 100 },
        },
    ],
};

export const AXIS_TICK_MAX_SPACING: AgCartesianChartOptions = {
    ...examples.SIMPLE_SCATTER_CHART_EXAMPLE,
    axes: [
        { type: 'number', position: 'left', interval: { maxSpacing: 30 } },
        { type: 'number', position: 'bottom', interval: { maxSpacing: 30 } },
    ],
};

export const AXIS_TICK_MIN_MAX_SPACING: AgCartesianChartOptions = {
    ...examples.GROUPED_COLUMN_EXAMPLE,
    axes: [
        { type: 'category', position: 'bottom', interval: { minSpacing: 150 } },
        { type: 'number', position: 'left', interval: { minSpacing: 50, maxSpacing: 100 } },
    ],
};

export const NUMBER_AXIS_NO_SERIES_FIXED_DOMAIN: AgCartesianChartOptions = {
    ...NUMBER_AXIS_NO_SERIES,
    axes: NUMBER_AXIS_NO_SERIES.axes?.map((a) => {
        if (a.position === 'left' && a.type === 'number') {
            return { ...a, min: 66, max: 84 };
        } else if (a.position === 'bottom' && a.type === 'number') {
            return { ...a, min: 150, max: 290 };
        }
        return a;
    }),
};

export const TIME_AXIS_NO_SERIES: AgCartesianChartOptions = {
    ...examples.ADV_TIME_AXIS_WITH_IRREGULAR_INTERVALS,
    series: examples.ADV_TIME_AXIS_WITH_IRREGULAR_INTERVALS.series?.map((s) => ({ ...s, visible: false })),
    legend: { enabled: false },
};

export const TIME_AXIS_NO_SERIES_FIXED_DOMAIN: AgCartesianChartOptions = {
    ...TIME_AXIS_NO_SERIES,
    axes: TIME_AXIS_NO_SERIES.axes?.map((a) => {
        if (a.position === 'left' && a.type === 'number') {
            return { ...a, min: 2.4, max: 4.7 };
        } else if (a.position === 'bottom' && a.type === 'time') {
            return {
                ...a,
                min: new Date('2020-01-01T00:25:35.920Z'),
                max: new Date('2020-01-31T14:15:33.950Z'),
            };
        }
        return a;
    }),
};

export const COMBO_CATEGORY_NUMBER_AXIS_NO_SERIES: AgCartesianChartOptions = {
    ...examples.ADV_COMBINATION_SERIES_CHART_EXAMPLE,
    series: examples.ADV_COMBINATION_SERIES_CHART_EXAMPLE.series?.map((s) => ({ ...s, visible: false })),
    legend: { enabled: false },
};

export const COMBO_CATEGORY_NUMBER_AXIS_NO_SERIES_FIXED_DOMAIN: AgCartesianChartOptions = {
    ...COMBO_CATEGORY_NUMBER_AXIS_NO_SERIES,
    axes: COMBO_CATEGORY_NUMBER_AXIS_NO_SERIES.axes?.map((a) => {
        if (a.position === 'left' && a.type === 'number') {
            return { ...a, min: 0, max: 4000 };
        } else if (a.position === 'right' && a.type === 'number') {
            return { ...a, min: 100000, max: 140000 };
        }
        return a;
    }),
};

export const COMBO_SERIES_AREA_PADDING: AgCartesianChartOptions = {
    ...COMBO_CATEGORY_NUMBER_AXIS_NO_SERIES,
    seriesArea: {
        padding: {
            left: 50,
            right: 50,
            bottom: 50,
        },
    },
    axes: COMBO_CATEGORY_NUMBER_AXIS_NO_SERIES.axes?.map((a) => {
        if (a.position === 'left' && a.type === 'number') {
            return { ...a, min: 0, max: 4000 };
        } else if (a.position === 'right' && a.type === 'number') {
            return { ...a, min: 100000, max: 140000 };
        }
        return a;
    }),
};

export const COMBO_SERIES_AREA_PADDING_WITHOUT_TITLES: AgCartesianChartOptions = {
    ...COMBO_SERIES_AREA_PADDING,
    axes: COMBO_SERIES_AREA_PADDING.axes?.map((axis) => ({
        ...axis,
        title: {
            enabled: false,
        },
    })),
};

export const COMBO_SERIES_AREA_PADDING_WITHOUT_LABELS: AgCartesianChartOptions = {
    ...COMBO_SERIES_AREA_PADDING,
    axes: COMBO_SERIES_AREA_PADDING.axes?.map((axis) => ({
        ...axis,
        label: {
            enabled: false,
        },
    })),
};

export const COMBO_SERIES_AREA_PADDING_WITHOUT_LABELS_OR_TITLES: AgCartesianChartOptions = {
    ...COMBO_SERIES_AREA_PADDING,
    axes: COMBO_SERIES_AREA_PADDING.axes?.map((axis) => ({
        ...axis,
        title: {
            enabled: false,
        },
        label: {
            enabled: false,
        },
    })),
};

export const AREA_CHART_NO_SERIES: AgCartesianChartOptions = {
    ...examples.STACKED_AREA_GRAPH_EXAMPLE,
    series: examples.STACKED_AREA_GRAPH_EXAMPLE.series?.map((s) => ({ ...s, visible: false })),
};

export const AREA_CHART_STACKED_NORMALISED_NO_SERIES: AgCartesianChartOptions = {
    ...examples.ONE_HUNDRED_PERCENT_STACKED_AREA_GRAPH_EXAMPLE,
    series: examples.ONE_HUNDRED_PERCENT_STACKED_AREA_GRAPH_EXAMPLE.series?.map((s) => ({ ...s, visible: false })),
};

const extremeAxisConfig = {
    title: {
        text: 'Axis title',
    },
    line: {
        stroke: 'yellow',
        width: 20,
    },
    tick: {
        stroke: 'blue',
        size: 20,
        width: 400,
    },
};

export const GRIDLINE_TICKLINE_CLIPPING: AgCartesianChartOptions = {
    ...CATEGORY_AXIS_BASIC_EXAMPLE,
    axes: [
        {
            type: 'category',
            position: 'bottom',
            ...extremeAxisConfig,
        },
        {
            type: 'number',
            position: 'left',
            ...extremeAxisConfig,
        },
    ],
};

export const GROUPED_CATEGORY_AXIS_GRIDLINE_TICKLINE_CLIPPING: AgCartesianChartOptions = {
    ...(examples.GROUPED_CATEGORY_AXIS_EXAMPLE as AgCartesianChartOptions),
    axes: [
        {
            type: 'grouped-category',
            position: 'bottom',
            ...extremeAxisConfig,
        },
        {
            type: 'number',
            position: 'left',
            ...extremeAxisConfig,
        },
    ],
};
