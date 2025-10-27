import type {
    AgAreaSeriesOptions,
    AgCartesianChartOptions,
    AgHierarchyChartOptions,
    AgPolarChartOptions,
} from 'ag-charts-types';

import { DATA_APPLE_REVENUE_BY_PRODUCT, DATA_BROWSER_MARKET_SHARE } from '../../test/data';
import { loadExampleOptions } from '../../test/load-example';
import {
    DATA_FEMALE_HEIGHT_WEIGHT,
    DATA_FRUIT_VEG_CONSUMPTION,
    DATA_MALE_HEIGHT_WEIGHT,
    DATA_MARKET_SHARE,
    DATA_TREEMAP,
} from './data';

const GROUPED_AREA_EXAMPLE: AgCartesianChartOptions & { series: AgAreaSeriesOptions[] } =
    loadExampleOptions('area-with-negative-values');
const { axes: _, ...LINE_WITH_GAPS_EXAMPLE }: AgCartesianChartOptions = loadExampleOptions('line-with-gaps');
const HISTOGRAM_EXAMPLE: AgCartesianChartOptions = loadExampleOptions('simple-histogram');
const SCATTER_EXAMPLE: AgCartesianChartOptions = loadExampleOptions('simple-scatter');
const GROUPED_LINE_EXAMPLE: AgCartesianChartOptions = loadExampleOptions('time-axis-with-irregular-intervals');
const BUBBLE_EXAMPLE: AgCartesianChartOptions = loadExampleOptions('bubble-with-negative-values');
const PIE_EXAMPLE: AgPolarChartOptions = loadExampleOptions('simple-pie');
const DONUT_EXAMPLE: AgPolarChartOptions = loadExampleOptions('simple-donut');

const columnSeriesLabelFormatter: ({ value }: { value: any }) => string = ({ value }) =>
    value == null ? '' : value.toFixed(0);

export const COLUMN_SERIES_LABELS: AgCartesianChartOptions = {
    title: {
        text: "Apple's revenue by product category",
    },
    subtitle: {
        text: 'in billion U.S. dollars',
    },
    data: DATA_APPLE_REVENUE_BY_PRODUCT,
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'iphone',
            label: { formatter: columnSeriesLabelFormatter },
        },
    ],
};

export const STACKED_COLUMN_SERIES_LABELS: AgCartesianChartOptions = {
    title: {
        text: "Apple's revenue by product category",
    },
    subtitle: {
        text: 'in billion U.S. dollars',
    },
    data: DATA_APPLE_REVENUE_BY_PRODUCT,
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'iphone',
            yName: 'iPhone',
            stacked: true,
            label: { formatter: columnSeriesLabelFormatter },
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'mac',
            yName: 'Mac',
            stacked: true,
            label: { formatter: columnSeriesLabelFormatter },
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'ipad',
            yName: 'iPad',
            stacked: true,
            label: { formatter: columnSeriesLabelFormatter },
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'wearables',
            yName: 'Wearables',
            stacked: true,
            label: { formatter: columnSeriesLabelFormatter },
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'services',
            yName: 'Services',
            stacked: true,
            label: { formatter: columnSeriesLabelFormatter },
        },
    ],
};

export const GROUPED_COLUMN_SERIES_LABELS: AgCartesianChartOptions = {
    title: {
        text: "Apple's revenue by product category",
    },
    subtitle: {
        text: 'in billion U.S. dollars',
    },
    data: DATA_APPLE_REVENUE_BY_PRODUCT.slice(0, 3),
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'iphone',
            yName: 'iPhone',
            label: { formatter: columnSeriesLabelFormatter },
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'mac',
            yName: 'Mac',
            label: { formatter: columnSeriesLabelFormatter },
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'ipad',
            yName: 'iPad',
            label: { formatter: columnSeriesLabelFormatter },
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'wearables',
            yName: 'Wearables',
            label: { formatter: columnSeriesLabelFormatter },
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'services',
            yName: 'Services',
            label: { formatter: columnSeriesLabelFormatter },
        },
    ],
};

export const BAR_SERIES_LABELS: AgCartesianChartOptions = {
    title: {
        text: "Apple's revenue by product category",
    },
    subtitle: {
        text: 'in billion U.S. dollars',
    },
    data: DATA_APPLE_REVENUE_BY_PRODUCT,
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'iphone',
            label: { formatter: columnSeriesLabelFormatter },
        },
    ],
};

export const STACKED_BAR_SERIES_LABELS: AgCartesianChartOptions = {
    title: {
        text: "Apple's revenue by product category",
    },
    subtitle: {
        text: 'in billion U.S. dollars',
    },
    data: DATA_APPLE_REVENUE_BY_PRODUCT,
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'iphone',
            yName: 'iPhone',
            stacked: true,
            label: { formatter: columnSeriesLabelFormatter },
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'mac',
            yName: 'Mac',
            stacked: true,
            label: { formatter: columnSeriesLabelFormatter },
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'ipad',
            yName: 'iPad',
            stacked: true,
            label: { formatter: columnSeriesLabelFormatter },
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'wearables',
            yName: 'Wearables',
            stacked: true,
            label: { formatter: columnSeriesLabelFormatter },
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'services',
            yName: 'Services',
            stacked: true,
            label: { formatter: columnSeriesLabelFormatter },
        },
    ],
};

export const GROUPED_BAR_SERIES_LABELS: AgCartesianChartOptions = {
    title: {
        text: "Apple's revenue by product category",
    },
    subtitle: {
        text: 'in billion U.S. dollars',
    },
    data: DATA_APPLE_REVENUE_BY_PRODUCT.slice(0, 3),
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'iphone',
            yName: 'iPhone',
            label: { formatter: columnSeriesLabelFormatter },
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'mac',
            yName: 'Mac',
            label: { formatter: columnSeriesLabelFormatter },
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'ipad',
            yName: 'iPad',
            label: { formatter: columnSeriesLabelFormatter },
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'wearables',
            yName: 'Wearables',
            label: { formatter: columnSeriesLabelFormatter },
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'services',
            yName: 'Services',
            label: { formatter: columnSeriesLabelFormatter },
        },
    ],
};

export const AREA_SERIES_LABELS: AgCartesianChartOptions = {
    title: {
        text: "Apple's revenue by product category",
    },
    subtitle: {
        text: 'in billion U.S. dollars',
    },
    data: DATA_BROWSER_MARKET_SHARE,
    series: [
        {
            type: 'area',
            xKey: 'year',
            yKey: 'ie',
            label: { formatter: columnSeriesLabelFormatter },
        },
    ],
};

export const STACKED_AREA_SERIES_LABELS: AgCartesianChartOptions = {
    title: {
        text: "Apple's revenue by product category",
    },
    subtitle: {
        text: 'in billion U.S. dollars',
    },
    data: DATA_BROWSER_MARKET_SHARE,
    series: [
        {
            type: 'area',
            xKey: 'year',
            yKey: 'ie',
            yName: 'IE',
            stacked: true,
            label: { formatter: columnSeriesLabelFormatter },
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'firefox',
            yName: 'FireFox',
            stacked: true,
            label: { formatter: columnSeriesLabelFormatter },
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'safari',
            yName: 'Safari',
            stacked: true,
            label: { formatter: columnSeriesLabelFormatter },
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'chrome',
            yName: 'Chrome',
            stacked: true,
            label: { formatter: columnSeriesLabelFormatter },
        },
    ],
};

export const GROUPED_AREA_SERIES_LABELS: AgCartesianChartOptions = {
    ...GROUPED_AREA_EXAMPLE,
    series: [
        ...(GROUPED_AREA_EXAMPLE.series?.slice(0, 3).map((s: any) => {
            return {
                ...s,
                label: {
                    enabled: true,
                },
            };
        }) ?? []),
    ],
};

export const LINE_SERIES_LABELS: AgCartesianChartOptions = {
    ...LINE_WITH_GAPS_EXAMPLE,
    series: [
        ...(LINE_WITH_GAPS_EXAMPLE.series?.slice(0, 3).map((s: any) => {
            return { ...s, label: { enabled: true } };
        }) ?? []),
    ],
};

export const HISTOGRAM_SERIES_LABELS: AgCartesianChartOptions = {
    ...HISTOGRAM_EXAMPLE,
    series: [...(HISTOGRAM_EXAMPLE.series?.map((s: any) => ({ ...s, label: { enabled: true } })) ?? [])],
};

export const HISTOGRAM_DATE_BASED_BUCKETS: AgCartesianChartOptions = {
    data: [
        {
            day: new Date('2010-07-30T00:00:00.000'),
            bicycleHires: 6897,
        },
        {
            day: new Date('2010-07-31T00:00:00.000'),
            bicycleHires: 5564,
        },
        {
            day: new Date('2010-08-01T00:00:00.000'),
            bicycleHires: 4303,
        },
        {
            day: new Date('2010-08-02T00:00:00.000'),
            bicycleHires: 6642,
        },
        {
            day: new Date('2010-08-03T00:00:00.000'),
            bicycleHires: 7966,
        },
        {
            day: new Date('2010-08-04T00:00:00.000'),
            bicycleHires: 7893,
        },
        {
            day: new Date('2010-08-05T00:00:00.000'),
            bicycleHires: 8724,
        },
        {
            day: new Date('2010-08-06T00:00:00.000'),
            bicycleHires: 9797,
        },
        {
            day: new Date('2010-08-07T00:00:00.000'),
            bicycleHires: 6631,
        },
        {
            day: new Date('2010-08-08T00:00:00.000'),
            bicycleHires: 7864,
        },
        {
            day: new Date('2010-08-09T00:00:00.000'),
            bicycleHires: 6191,
        },
        {
            day: new Date('2010-08-10T00:00:00.000'),
            bicycleHires: 4802,
        },
        {
            day: new Date('2010-08-11T00:00:00.000'),
            bicycleHires: 14013,
        },
        {
            day: new Date('2010-08-12T00:00:00.000'),
            bicycleHires: 13080,
        },
        {
            day: new Date('2010-08-13T00:00:00.000'),
            bicycleHires: 12151,
        },
        {
            day: new Date('2010-08-14T00:00:00.000'),
            bicycleHires: 9195,
        },
        {
            day: new Date('2010-08-15T00:00:00.000'),
            bicycleHires: 10928,
        },
        {
            day: new Date('2010-08-16T00:00:00.000'),
            bicycleHires: 15384,
        },
        {
            day: new Date('2010-08-17T00:00:00.000'),
            bicycleHires: 15396,
        },
        {
            day: new Date('2010-08-18T00:00:00.000'),
            bicycleHires: 16062,
        },
        {
            day: new Date('2010-08-19T00:00:00.000'),
            bicycleHires: 17170,
        },
        {
            day: new Date('2010-08-20T00:00:00.000'),
            bicycleHires: 16462,
        },
        {
            day: new Date('2010-08-21T00:00:00.000'),
            bicycleHires: 11719,
        },
        {
            day: new Date('2010-08-22T00:00:00.000'),
            bicycleHires: 10129,
        },
        {
            day: new Date('2010-08-23T00:00:00.000'),
            bicycleHires: 12935,
        },
        {
            day: new Date('2010-08-24T00:00:00.000'),
            bicycleHires: 17006,
        },
        {
            day: new Date('2010-08-25T00:00:00.000'),
            bicycleHires: 10062,
        },
        {
            day: new Date('2010-08-26T00:00:00.000'),
            bicycleHires: 9875,
        },
        {
            day: new Date('2010-08-27T00:00:00.000'),
            bicycleHires: 12854,
        },
        {
            day: new Date('2010-08-28T00:00:00.000'),
            bicycleHires: 10116,
        },
        {
            day: new Date('2010-08-29T00:00:00.000'),
            bicycleHires: 7811,
        },
        {
            day: new Date('2010-08-30T00:00:00.000'),
            bicycleHires: 10534,
        },
        {
            day: new Date('2010-08-31T00:00:00.000'),
            bicycleHires: 17508,
        },
        {
            day: new Date('2010-09-01T00:00:00.000'),
            bicycleHires: 19332,
        },
        {
            day: new Date('2010-09-02T00:00:00.000'),
            bicycleHires: 20909,
        },
        {
            day: new Date('2010-09-03T00:00:00.000'),
            bicycleHires: 20113,
        },
        {
            day: new Date('2010-09-04T00:00:00.000'),
            bicycleHires: 14373,
        },
        {
            day: new Date('2010-09-05T00:00:00.000'),
            bicycleHires: 12924,
        },
        {
            day: new Date('2010-09-06T00:00:00.000'),
            bicycleHires: 16841,
        },
        {
            day: new Date('2010-09-07T00:00:00.000'),
            bicycleHires: 25361,
        },
        {
            day: new Date('2010-09-08T00:00:00.000'),
            bicycleHires: 18727,
        },
        {
            day: new Date('2010-09-09T00:00:00.000'),
            bicycleHires: 20774,
        },
        {
            day: new Date('2010-09-10T00:00:00.000'),
            bicycleHires: 19532,
        },
        {
            day: new Date('2010-09-11T00:00:00.000'),
            bicycleHires: 13383,
        },
        {
            day: new Date('2010-09-12T00:00:00.000'),
            bicycleHires: 14002,
        },
        {
            day: new Date('2010-09-13T00:00:00.000'),
            bicycleHires: 18037,
        },
        {
            day: new Date('2010-09-14T00:00:00.000'),
            bicycleHires: 17026,
        },
        {
            day: new Date('2010-09-15T00:00:00.000'),
            bicycleHires: 20890,
        },
        {
            day: new Date('2010-09-16T00:00:00.000'),
            bicycleHires: 20433,
        },
        {
            day: new Date('2010-09-17T00:00:00.000'),
            bicycleHires: 20488,
        },
        {
            day: new Date('2010-09-18T00:00:00.000'),
            bicycleHires: 15495,
        },
        {
            day: new Date('2010-09-19T00:00:00.000'),
            bicycleHires: 11492,
        },
        {
            day: new Date('2010-09-20T00:00:00.000'),
            bicycleHires: 20169,
        },
        {
            day: new Date('2010-09-21T00:00:00.000'),
            bicycleHires: 22906,
        },
        {
            day: new Date('2010-09-22T00:00:00.000'),
            bicycleHires: 23905,
        },
        {
            day: new Date('2010-09-23T00:00:00.000'),
            bicycleHires: 17729,
        },
        {
            day: new Date('2010-09-24T00:00:00.000'),
            bicycleHires: 18053,
        },
        {
            day: new Date('2010-09-25T00:00:00.000'),
            bicycleHires: 14010,
        },
        {
            day: new Date('2010-09-26T00:00:00.000'),
            bicycleHires: 7890,
        },
        {
            day: new Date('2010-09-27T00:00:00.000'),
            bicycleHires: 18789,
        },
        {
            day: new Date('2010-09-28T00:00:00.000'),
            bicycleHires: 21554,
        },
        {
            day: new Date('2010-09-29T00:00:00.000'),
            bicycleHires: 13899,
        },
        {
            day: new Date('2010-09-30T00:00:00.000'),
            bicycleHires: 21823,
        },
        {
            day: new Date('2010-10-01T00:00:00.000'),
            bicycleHires: 11424,
        },
        {
            day: new Date('2010-10-02T00:00:00.000'),
            bicycleHires: 10704,
        },
        {
            day: new Date('2010-10-03T00:00:00.000'),
            bicycleHires: 8237,
        },
        {
            day: new Date('2010-10-04T00:00:00.000'),
            bicycleHires: 23688,
        },
        {
            day: new Date('2010-10-05T00:00:00.000'),
            bicycleHires: 22054,
        },
        {
            day: new Date('2010-10-06T00:00:00.000'),
            bicycleHires: 20114,
        },
        {
            day: new Date('2010-10-07T00:00:00.000'),
            bicycleHires: 24072,
        },
        {
            day: new Date('2010-10-08T00:00:00.000'),
            bicycleHires: 22886,
        },
        {
            day: new Date('2010-10-09T00:00:00.000'),
            bicycleHires: 14463,
        },
        {
            day: new Date('2010-10-10T00:00:00.000'),
            bicycleHires: 14871,
        },
        {
            day: new Date('2010-10-11T00:00:00.000'),
            bicycleHires: 21986,
        },
        {
            day: new Date('2010-10-12T00:00:00.000'),
            bicycleHires: 23016,
        },
        {
            day: new Date('2010-10-13T00:00:00.000'),
            bicycleHires: 22251,
        },
        {
            day: new Date('2010-10-14T00:00:00.000'),
            bicycleHires: 21582,
        },
        {
            day: new Date('2010-10-15T00:00:00.000'),
            bicycleHires: 20934,
        },
        {
            day: new Date('2010-10-16T00:00:00.000'),
            bicycleHires: 12735,
        },
        {
            day: new Date('2010-10-17T00:00:00.000'),
            bicycleHires: 12764,
        },
        {
            day: new Date('2010-10-18T00:00:00.000'),
            bicycleHires: 20464,
        },
        {
            day: new Date('2010-10-19T00:00:00.000'),
            bicycleHires: 17964,
        },
        {
            day: new Date('2010-10-20T00:00:00.000'),
            bicycleHires: 20750,
        },
    ],
    series: [
        {
            type: 'histogram',
            yKey: 'bicycleHires',
            xKey: 'day',
        },
    ],
    axes: {
        y: {
            type: 'number',
            position: 'right',
            label: {
                formatter: (params) => `${params.value / 1000000}M`,
            },
        },
        x: {
            type: 'time',
            position: 'bottom',
            label: {
                format: `%b %d`,
            },
        },
    },
};

export const SCATTER_SERIES_LABELS: AgCartesianChartOptions = {
    ...SCATTER_EXAMPLE,
    series: [
        ...(SCATTER_EXAMPLE.series?.map((s: any) => {
            return {
                ...s,
                labelKey: 'team',
                label: {
                    enabled: true,
                },
            };
        }) ?? []),
    ],
};

export const GROUPED_SCATTER_SERIES_LABELS: AgCartesianChartOptions = {
    ...GROUPED_LINE_EXAMPLE,
    series: [
        ...(GROUPED_LINE_EXAMPLE.series?.map((s: any) => ({
            ...s,
            type: 'scatter',
            labelKey: 'magnitude',
            label: { enabled: true },
        })) ?? []),
    ],
};

export const BUBBLE_SERIES_LABELS: AgCartesianChartOptions = {
    ...BUBBLE_EXAMPLE,
    series: [
        ...(BUBBLE_EXAMPLE.series?.map((s: any) => {
            return {
                ...s,
                labelKey: 'city',
                label: {
                    enabled: true,
                },
            };
        }) ?? []),
    ],
    axes: {
        x: {
            position: 'bottom',
            type: 'number',
            title: {
                text: 'Longitude',
            },
            interval: {
                minSpacing: 300,
            },
            line: {
                stroke: 'transparent',
            },
            gridLine: {
                style: [
                    {},
                    {
                        stroke: 'rgb(219, 219, 219)',
                        lineDash: [4, 2],
                    },
                ],
            },
        },
        y: {
            position: 'left',
            type: 'number',
            title: {
                text: 'Latitude',
            },
            interval: {
                minSpacing: 200,
            },
            line: {
                stroke: 'transparent',
            },
            gridLine: {
                style: [
                    {},
                    {
                        stroke: 'rgb(219, 219, 219)',
                        lineDash: [4, 2],
                    },
                ],
            },
        },
    },
};

export const GROUPED_BUBBLE_SERIES_LABELS: AgCartesianChartOptions = {
    title: {
        text: 'Weight vs Height',
    },
    subtitle: {
        text: 'by gender',
    },
    series: [
        {
            type: 'bubble',
            title: 'Male',
            data: DATA_MALE_HEIGHT_WEIGHT,
            xKey: 'height',
            xName: 'Height',
            yKey: 'weight',
            yName: 'Weight',
            sizeKey: 'age',
            sizeName: 'Age',
            size: 6,
            maxSize: 30,
            fill: 'rgba(227,111,106,0.71)',
            stroke: '#9f4e4a',
            labelKey: 'name',
            label: {
                enabled: true,
            },
        },
        {
            type: 'bubble',
            title: 'Female',
            data: DATA_FEMALE_HEIGHT_WEIGHT,
            xKey: 'height',
            xName: 'Height',
            yKey: 'weight',
            yName: 'Weight',
            sizeKey: 'age',
            sizeName: 'Age',
            size: 6,
            maxSize: 30,
            fill: 'rgba(123,145,222,0.71)',
            stroke: '#56659b',
            labelKey: 'name',
            label: {
                enabled: true,
            },
        },
    ],
    axes: {
        x: {
            type: 'number',
            position: 'bottom',
            title: {
                text: 'Height',
            },
            gridLine: {
                style: [{}],
            },
        },
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: 'Weight',
            },
            line: {
                stroke: undefined,
            },
            label: {
                formatter: (params) => {
                    return params.value + 'kg';
                },
            },
        },
    },
};

export const PIE_SERIES_LABELS: AgPolarChartOptions = {
    ...PIE_EXAMPLE,
};

export const DONUT_SERIES_LABELS: AgPolarChartOptions = {
    ...DONUT_EXAMPLE,
    series: [
        ...(DONUT_EXAMPLE.series?.map((s) => {
            return {
                ...s,
                calloutLabel: {
                    enabled: true,
                },
            };
        }) ?? []),
    ],
};

export const GROUPED_DONUT_SERIES_LABELS: AgPolarChartOptions = {
    data: DATA_MARKET_SHARE,
    series: [
        {
            type: 'donut',
            title: {
                text: 'Market Share',
            },
            calloutLabelKey: 'os',
            angleKey: 'share',
            innerRadiusOffset: -40,
        },
        {
            type: 'donut',
            title: {
                text: 'Satisfaction',
            },
            calloutLabelKey: 'os',
            angleKey: 'satisfaction',
            outerRadiusOffset: -70,
            innerRadiusOffset: -200,
        },
    ],
};

export const SUNBURST_SERIES_LABELS: AgHierarchyChartOptions = {
    data: DATA_TREEMAP,
    series: [
        {
            type: 'sunburst',
            labelKey: 'orgHierarchy',
            sizeKey: undefined, // make all siblings within a parent the same size
            colorKey: undefined, // if undefined, depth will be used as the value, where root has 0 depth
            colorRange: ['#d73027', '#fee08b', '#1a9850', 'rgb(0, 116, 52)'],
            sectorSpacing: 3,
        },
    ],
    title: {
        text: 'Organisational Chart',
    },
    subtitle: {
        text: 'of a top secret startup',
    },
};

export const TREEMAP_SERIES_LABELS: AgHierarchyChartOptions = {
    data: DATA_TREEMAP,
    series: [
        {
            type: 'treemap',
            labelKey: 'orgHierarchy',
            sizeKey: undefined, // make all siblings within a parent the same size
            colorKey: undefined, // if undefined, depth will be used as the value, where root has 0 depth
            colorRange: ['#d73027', '#fee08b', '#1a9850', 'rgb(0, 116, 52)'],
            group: {
                padding: 5,
            },
            tile: {
                label: {
                    spacing: 1,
                },
                gap: 5,
            },
        },
    ],
    title: {
        text: 'Organisational Chart',
    },
    subtitle: {
        text: 'of a top secret startup',
    },
};

export const LINE_COLUMN_COMBO_SERIES_LABELS: AgCartesianChartOptions = {
    data: DATA_FRUIT_VEG_CONSUMPTION,
    theme: {
        palette: {
            fills: ['#7cecb3', '#7cb5ec', '#ecb37c', '#ec7cb5', '#7c7dec'],
            strokes: ['#7cecb3', '#7cb5ec', '#ecb37c', '#ec7cb5', '#7c7dec'],
        },
    },
    title: {
        text: 'Fruit & Vegetable Consumption',
        fontSize: 15,
    },
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'women',
            yName: 'Women',
            stacked: true,
            strokeWidth: 0,
            label: {
                enabled: true,
            },
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'men',
            yName: 'Men',
            stacked: true,
            strokeWidth: 0,
            label: {
                enabled: true,
            },
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'portions',
            yName: 'Portions',
            strokeWidth: 3,
            label: {
                enabled: true,
            },
        },
    ],
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
            gridLine: {
                style: [{}],
            },
        },
        y: {
            type: 'number',
            position: 'left',
            keys: ['women', 'men', 'children', 'adults'],
            title: {
                text: 'Adults Who Eat 5 A Day (%)',
            },
        },
        ySecondary: {
            type: 'number',
            position: 'right',
            keys: ['portions'],
            title: {
                text: 'Portions Consumed (Per Day)',
            },
        },
    },
};

export const AREA_COLUMN_COMBO_SERIES_LABELS: AgCartesianChartOptions = {
    data: DATA_FRUIT_VEG_CONSUMPTION,
    theme: {
        palette: {
            fills: ['#7cecb3', '#7cb5ec', '#ecb37c', '#ec7cb5', '#7c7dec'],
            strokes: ['#7cecb3', '#7cb5ec', '#ecb37c', '#ec7cb5', '#7c7dec'],
        },
    },
    title: {
        text: 'Fruit & Vegetable Consumption',
        fontSize: 15,
    },
    series: [
        {
            type: 'area',
            xKey: 'year',
            yKey: 'portions',
            yName: 'Portions',
            strokeWidth: 3,
            marker: {
                enabled: true,
            },
            label: {
                enabled: true,
            },
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'women',
            yName: 'Women',
            stacked: true,
            strokeWidth: 0,
            label: {
                enabled: true,
            },
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'men',
            yName: 'Men',
            stacked: true,
            strokeWidth: 0,
            label: {
                enabled: true,
            },
        },
    ],
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
            gridLine: {
                style: [{}],
            },
        },
        y: {
            type: 'number',
            position: 'left',
            keys: ['women', 'men', 'children', 'adults'],
            title: {
                text: 'Adults Who Eat 5 A Day (%)',
            },
        },
        ySecondary: {
            type: 'number',
            position: 'right',
            keys: ['portions'],
            title: {
                text: 'Portions Consumed (Per Day)',
            },
        },
    },
};

export const HISTOGRAM_SCATTER_COMBO_SERIES_LABELS: AgCartesianChartOptions = {
    data: DATA_MALE_HEIGHT_WEIGHT.concat(DATA_FEMALE_HEIGHT_WEIGHT),
    title: {
        text: 'Vehicle fuel efficiency by engine size (USA 1987)',
        fontSize: 18,
    },
    subtitle: {
        text: 'Source: UCI',
    },
    series: [
        {
            type: 'histogram',
            xKey: 'weight',
            xName: 'Weight',
            yKey: 'height',
            yName: 'Height',
            fill: '#41874b',
            stroke: '#41874b',
            fillOpacity: 0.5,
            aggregation: 'mean',
            label: {
                color: '#dcdbe5',
                fontWeight: 'bold',
                fontSize: 20,
                formatter: (params) => params.value.toFixed(0),
            },
        },
        {
            type: 'scatter',
            xKey: 'weight',
            xName: 'Weight',
            yKey: 'age',
            yName: 'Age',
            labelKey: 'age',
            size: 7,
            fill: '#ccb9c9',
            strokeWidth: 0,
            label: { enabled: true },
        },
    ],
    axes: {
        x: {
            position: 'bottom',
            type: 'number',
            title: {
                enabled: true,
                text: 'Weight (kg)',
            },
            gridLine: {
                style: [{}],
            },
        },
        y: {
            position: 'left',
            type: 'number',
            keys: ['height'],
            title: {
                enabled: true,
                text: 'Height',
            },
            line: {
                stroke: undefined,
            },
        },
        ySecondary: {
            position: 'right',
            type: 'number',
            keys: ['age'],
            line: {
                stroke: undefined,
            },
        },
    },
    legend: {
        position: 'bottom',
    },
};
