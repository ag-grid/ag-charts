import { AgPolarChartOptions } from 'ag-charts-community';

import { DATA_REVENUE_BY_PRODUCT_CATEGORY } from './data';

const sharedOptions = {
    title: {
        text: 'Revenue by Product Category',
    },
    subtitle: {
        text: 'Millions USD',
    },
    data: DATA_REVENUE_BY_PRODUCT_CATEGORY,
};

type Options = {
    options: AgPolarChartOptions;
};

export const RADAR_LINE_CIRCLE_CROSSLINES: Options = {
    options: {
        ...sharedOptions,
        series: [
            {
                type: 'radar-line',
                radiusKey: 'software',
                radiusName: 'Software',
                angleKey: 'quarter',
            },
            {
                type: 'radar-line',
                radiusKey: 'hardware',
                radiusName: 'Hardware',
                angleKey: 'quarter',
            },
            {
                type: 'radar-line',
                radiusKey: 'services',
                radiusName: 'Services',
                angleKey: 'quarter',
            },
        ],
        axes: [
            {
                type: 'angle-category',
                shape: 'circle',
                crossLines: [
                    {
                        type: 'line',
                        value: "Q3'22",
                        label: {
                            text: 'Line Three',
                        },
                    },
                    {
                        type: 'range',
                        range: ["Q1'23", "Q2'23"],
                        label: {
                            text: 'Range Four',
                        },
                    },
                    {
                        type: 'range',
                        range: ["Q3'23", "Q4'23"],
                        label: {
                            text: 'Range Five',
                        },
                    },
                ],
            },
            {
                type: 'radius-number',
                shape: 'circle',
                crossLines: [
                    {
                        type: 'line',
                        value: 4.5,
                        label: {
                            text: 'Line One',
                            positionAngle: 45,
                        },
                    },
                    {
                        type: 'range',
                        range: [1, 3],
                        label: {
                            text: 'Range Two',
                            positionAngle: 135,
                        },
                    },
                ],
            },
        ],
    },
};

export const RADIAL_BAR_CIRCLE_CROSSLINES: Options = {
    options: {
        ...sharedOptions,
        data: DATA_REVENUE_BY_PRODUCT_CATEGORY.slice(4),
        series: [
            {
                type: 'radial-bar',
                radiusKey: 'quarter',
                angleKey: 'software',
                angleName: 'Software',
            },
            {
                type: 'radial-bar',
                radiusKey: 'quarter',
                angleKey: 'hardware',
                angleName: 'Hardware',
            },
            {
                type: 'radial-bar',
                radiusKey: 'quarter',
                angleKey: 'services',
                angleName: 'Services',
            },
        ],
        axes: [
            {
                type: 'radius-category',
                groupPaddingInner: 0.2,
                paddingInner: 0.5,
                crossLines: [
                    {
                        type: 'line',
                        value: "Q4'23",
                        label: {
                            text: 'Line One',
                            positionAngle: 45,
                        },
                    },
                    {
                        type: 'range',
                        range: ["Q1'23", "Q2'23"],
                        label: {
                            text: 'Range Two',
                            positionAngle: 135,
                        },
                    },
                ],
            },
            {
                type: 'angle-number',
                crossLines: [
                    {
                        type: 'line',
                        value: 1,
                        label: {
                            text: 'Line Three',
                        },
                    },
                    {
                        type: 'range',
                        range: [1.5, 2.5],
                        label: {
                            text: 'Range Four',
                        },
                    },
                    {
                        type: 'range',
                        range: [2.5, 3.5],
                        label: {
                            text: 'Range Five',
                        },
                    },
                ],
            },
        ],
    },
};
export const RADAR_LINE_POLYGON_CROSSLINES: Options = {
    options: {
        ...sharedOptions,
        series: [
            {
                type: 'radar-line',
                radiusKey: 'software',
                radiusName: 'Software',
                angleKey: 'quarter',
            },
            {
                type: 'radar-line',
                radiusKey: 'hardware',
                radiusName: 'Hardware',
                angleKey: 'quarter',
            },
            {
                type: 'radar-line',
                radiusKey: 'services',
                radiusName: 'Services',
                angleKey: 'quarter',
            },
        ],
        axes: [
            {
                type: 'angle-category',
                shape: 'polygon',
                crossLines: [
                    {
                        type: 'line',
                        value: "Q3'22",
                        label: {
                            text: 'Line Three',
                        },
                    },
                    {
                        type: 'range',
                        range: ["Q1'23", "Q2'23"],
                        label: {
                            text: 'Range Four',
                        },
                    },
                    {
                        type: 'range',
                        range: ["Q3'23", "Q4'23"],
                        label: {
                            text: 'Range Five',
                        },
                    },
                ],
            },
            {
                type: 'radius-number',
                shape: 'polygon',
                crossLines: [
                    {
                        type: 'line',
                        value: 4.5,
                        label: {
                            text: 'Line One',
                            positionAngle: 45,
                        },
                    },
                    {
                        type: 'range',
                        range: [1, 3],
                        label: {
                            text: 'Range Two',
                            positionAngle: 135,
                        },
                    },
                ],
            },
        ],
    },
};
export const RADIAL_BAR_POLYGON_CROSSLINES: Options = {
    options: {
        ...sharedOptions,
        data: DATA_REVENUE_BY_PRODUCT_CATEGORY.slice(4),
        series: [
            {
                type: 'radial-bar',
                radiusKey: 'quarter',
                angleKey: 'software',
                angleName: 'Software',
            },
            {
                type: 'radial-bar',
                radiusKey: 'quarter',
                angleKey: 'hardware',
                angleName: 'Hardware',
            },
            {
                type: 'radial-bar',
                radiusKey: 'quarter',
                angleKey: 'services',
                angleName: 'Services',
            },
        ],
        axes: [
            {
                type: 'radius-category',
                groupPaddingInner: 0.2,
                paddingInner: 0.5,
                crossLines: [
                    {
                        type: 'line',
                        value: "Q4'23",
                        label: {
                            text: 'Line One',
                            positionAngle: 45,
                        },
                    },
                    {
                        type: 'range',
                        range: ["Q1'23", "Q2'23"],
                        label: {
                            text: 'Range Two',
                            positionAngle: 135,
                        },
                    },
                ],
            },
            {
                type: 'angle-number',
                crossLines: [
                    {
                        type: 'line',
                        value: 1,
                        label: {
                            text: 'Line Three',
                        },
                    },
                    {
                        type: 'range',
                        range: [1.5, 2.5],
                        label: {
                            text: 'Range Four',
                        },
                    },
                    {
                        type: 'range',
                        range: [2.5, 3.5],
                        label: {
                            text: 'Range Five',
                        },
                    },
                ],
            },
        ],
    },
};

export const RADIAL_COLUMN_CATEGORY_CROSSLINES: Options = {
    options: {
        ...sharedOptions,
        series: [
            {
                type: 'radial-column',
                angleKey: 'quarter',
                radiusKey: 'software',
                radiusName: 'Software',
                grouped: true,
            },
            {
                type: 'radial-column',
                angleKey: 'quarter',
                radiusKey: 'hardware',
                radiusName: 'Hardware',
                grouped: true,
            },
            {
                type: 'radial-column',
                angleKey: 'quarter',
                radiusKey: 'services',
                radiusName: 'Services',
                grouped: true,
            },
        ],
        axes: [
            {
                type: 'angle-category',
                groupPaddingInner: 0.5,
                paddingInner: 0.5,
                crossLines: [
                    {
                        type: 'range',
                        range: ["Q2'22", "Q4'22"],
                        label: {
                            text: 'Range One',
                        },
                    },
                    {
                        type: 'range',
                        range: ["Q1'23", "Q2'23"],
                        label: {
                            text: 'Range Two',
                        },
                    },
                    {
                        type: 'line',
                        value: "Q4'23",
                        label: {
                            text: 'Line Three',
                        },
                    },
                ],
            },
            {
                type: 'radius-number',
                innerRadiusRatio: 0.2,
                crossLines: [
                    {
                        type: 'range',
                        range: [2, 4],
                        label: {
                            text: 'Range Four',
                        },
                    },
                ],
            },
        ],
    },
};
