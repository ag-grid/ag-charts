import type {
    AgAreaSeriesOptions,
    AgCartesianChartOptions,
    AgHierarchyChartOptions,
    AgPolarChartOptions,
} from '../../../options/agChartOptions';
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
const { axes, ...LINE_WITH_GAPS_EXAMPLE }: AgCartesianChartOptions = loadExampleOptions('line-with-gaps');
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
    axes: [
        {
            position: 'bottom',
            type: 'number',
            title: {
                text: 'Longitude',
            },
            tick: {
                minSpacing: 300,
            },
            line: {
                color: 'transparent',
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
        {
            position: 'left',
            type: 'number',
            title: {
                text: 'Latitude',
            },
            tick: {
                minSpacing: 200,
            },
            line: {
                color: 'transparent',
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
    ],
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
            marker: {
                size: 6,
                maxSize: 30,
                fill: 'rgba(227,111,106,0.71)',
                stroke: '#9f4e4a',
            },
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
            marker: {
                size: 6,
                maxSize: 30,
                fill: 'rgba(123,145,222,0.71)',
                stroke: '#56659b',
            },
            labelKey: 'name',
            label: {
                enabled: true,
            },
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'bottom',
            title: {
                text: 'Height',
            },
            gridLine: {
                style: [{}],
            },
        },
        {
            type: 'number',
            position: 'left',
            title: {
                text: 'Weight',
            },
            line: {
                color: undefined,
            },
            label: {
                formatter: (params) => {
                    return params.value + 'kg';
                },
            },
        },
    ],
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
            colorKey: undefined, // if undefined, depth will be used an the value, where root has 0 depth
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
            colorKey: undefined, // if undefined, depth will be used an the value, where root has 0 depth
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
    axes: [
        {
            type: 'category',
            position: 'bottom',
            gridLine: {
                style: [{}],
            },
        },
        {
            type: 'number',
            position: 'left',
            keys: ['women', 'men', 'children', 'adults'],
            title: {
                text: 'Adults Who Eat 5 A Day (%)',
            },
        },
        {
            type: 'number',
            position: 'right',
            keys: ['portions'],
            title: {
                text: 'Portions Consumed (Per Day)',
            },
        },
    ],
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
    axes: [
        {
            type: 'category',
            position: 'bottom',
            gridLine: {
                style: [{}],
            },
        },
        {
            type: 'number',
            position: 'left',
            keys: ['women', 'men', 'children', 'adults'],
            title: {
                text: 'Adults Who Eat 5 A Day (%)',
            },
        },
        {
            type: 'number',
            position: 'right',
            keys: ['portions'],
            title: {
                text: 'Portions Consumed (Per Day)',
            },
        },
    ],
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
            marker: {
                fill: '#ccb9c9',
                stroke: '#9b7595',
                strokeWidth: 0,
                size: 7,
            },
            label: {},
        },
    ],
    axes: [
        {
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
        {
            position: 'left',
            type: 'number',
            keys: ['height'],
            title: {
                enabled: true,
                text: 'Height',
            },
            line: {
                color: undefined,
            },
        },
        {
            position: 'right',
            type: 'number',
            keys: ['age'],
            line: {
                color: undefined,
            },
        },
    ],
    legend: {
        position: 'bottom',
    },
};
