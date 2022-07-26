import day from '../../util/time/day';
import { AgChartOptions } from '../agChartOptions';
import { DATA_TOTAL_GAME_WINNINGS_GROUPED_BY_COUNTRY_EXTENDED } from './data';
import * as data from './data-axes';
import * as examples from './examples';

export const CATEGORY_AXIS_BASIC_EXAMPLE: AgChartOptions = {
    type: 'column',
    data: data.DATA_COUNTRY_DIETARY_STATS,
    axes: [
        { type: 'category', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
    series: [
        {
            xKey: 'country',
            xName: 'Country',
            yKeys: ['sugar', 'fat', 'weight'],
            yNames: ['Sugar', 'Fat', 'Weight'],
            grouped: true,
            type: 'column',
        },
    ],
};

export const CATEGORY_AXIS_UNIFORM_BASIC_EXAMPLE: AgChartOptions = {
    type: 'column',
    data: data.DATA_YOUTUBE_VIDEOS_STATS_BY_DAY_OF_YEAR,
    axes: [
        { type: 'category', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
    series: [
        {
            xKey: 'day',
            xName: 'Day',
            yKeys: ['likes'],
            yNames: ['Likes'],
            type: 'column',
        },
    ],
};

export const TIME_AXIS_BASIC_EXAMPLE: AgChartOptions = {
    data: data.DATA_YOUTUBE_VIDEOS_STATS_BY_DATE,
    axes: [
        { type: 'time', position: 'bottom', tick: { count: day } },
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

export const NUMBER_AXIS_UNIFORM_BASIC_EXAMPLE: AgChartOptions = {
    type: 'line',
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

export const GROUPED_CATEGORY_AXIS_EXAMPLE: AgChartOptions = {
    ...examples.GROUPED_CATEGORY_AXIS_EXAMPLE,
    data: DATA_TOTAL_GAME_WINNINGS_GROUPED_BY_COUNTRY_EXTENDED.slice(0, 20),
};

export const NUMBER_AXIS_NO_SERIES: AgChartOptions = {
    ...examples.SIMPLE_SCATTER_CHART_EXAMPLE,
    series: examples.SIMPLE_SCATTER_CHART_EXAMPLE.series?.map((s) => ({ ...s, visible: false })),
    legend: { enabled: false },
};

export const NUMBER_AXIS_NO_SERIES_FIXED_DOMAIN: AgChartOptions = {
    ...NUMBER_AXIS_NO_SERIES,
    axes: NUMBER_AXIS_NO_SERIES.axes?.map((a) => {
        if (a.position === 'left') {
            return { ...a, min: 66, max: 84 };
        } else if (a.position === 'bottom') {
            return { ...a, min: 150, max: 290 };
        }
        return a;
    }),
};

export const TIME_AXIS_NO_SERIES: AgChartOptions = {
    ...examples.ADV_TIME_AXIS_WITH_IRREGULAR_INTERVALS,
    series: examples.ADV_TIME_AXIS_WITH_IRREGULAR_INTERVALS.series?.map((s) => ({ ...s, visible: false })),
    legend: { enabled: false },
};

export const TIME_AXIS_NO_SERIES_FIXED_DOMAIN: AgChartOptions = {
    ...TIME_AXIS_NO_SERIES,
    axes: TIME_AXIS_NO_SERIES.axes?.map((a) => {
        if (a.position === 'left') {
            return { ...a, min: 2.4, max: 4.7 };
        } else if (a.position === 'bottom') {
            return { ...a, domain: [new Date('2020-01-01T00:25:35.920Z'), new Date('2020-01-31T14:15:33.950Z')] };
        }
        return a;
    }),
};

export const COMBO_CATEGORY_NUMBER_AXIS_NO_SERIES: AgChartOptions = {
    ...examples.ADV_COMBINATION_SERIES_CHART_EXAMPLE,
    series: examples.ADV_COMBINATION_SERIES_CHART_EXAMPLE.series?.map((s) => ({ ...s, visible: false })),
    legend: { enabled: false },
};

export const COMBO_CATEGORY_NUMBER_AXIS_NO_SERIES_FIXED_DOMAIN: AgChartOptions = {
    ...COMBO_CATEGORY_NUMBER_AXIS_NO_SERIES,
    axes: COMBO_CATEGORY_NUMBER_AXIS_NO_SERIES.axes?.map((a) => {
        if (a.position === 'left') {
            return { ...a, min: 0, max: 4000 };
        } else if (a.position === 'right') {
            return { ...a, min: 100000, max: 140000 };
        }
        return a;
    }),
};
