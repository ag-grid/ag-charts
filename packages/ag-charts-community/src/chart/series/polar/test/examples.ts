import type { AgPolarChartOptions } from 'ag-charts-types';

import {
    DATA_MANY_LONG_LABELS,
    DATA_MARKET_SHARE,
    DATA_MARKET_SHARE_WITH_NEGATIVE_VALUES,
    DATA_VARIABLE_RADIUS_REVENUE,
} from './data';

export const PIE_SERIES: AgPolarChartOptions = {
    title: {
        text: 'Market Share',
    },
    data: DATA_MARKET_SHARE,
    series: [
        {
            type: 'pie',
            calloutLabelKey: 'os',
            angleKey: 'share',
        },
    ],
};

export const PIE_SERIES_NEGATIVE_VALUES: AgPolarChartOptions = {
    title: {
        text: 'Market Share',
    },
    data: DATA_MARKET_SHARE_WITH_NEGATIVE_VALUES,
    series: [
        {
            type: 'pie',
            calloutLabelKey: 'os',
            angleKey: 'share',
        },
    ],
};

export const PIE_SECTORS_DIFFERENT_RADII: AgPolarChartOptions = {
    title: {
        text: 'Market Share',
    },
    data: DATA_MARKET_SHARE,
    series: [
        {
            type: 'pie',
            calloutLabelKey: 'os',
            angleKey: 'share',
            radiusKey: 'satisfaction',
        },
    ],
};

const minRadius = Math.min(...DATA_MARKET_SHARE.map((d) => d.satisfaction));
const maxRadius = Math.max(...DATA_MARKET_SHARE.map((d) => d.satisfaction));

export const PIE_SECTORS_DIFFERENT_RADII_SMALL_RADIUS_MIN: AgPolarChartOptions = {
    title: {
        text: 'Market Share',
    },
    data: DATA_MARKET_SHARE,
    series: [
        {
            type: 'pie',
            calloutLabelKey: 'os',
            angleKey: 'share',
            radiusKey: 'satisfaction',
            radiusMin: minRadius - 2,
        },
    ],
};

export const PIE_SECTORS_DIFFERENT_RADII_LARGE_RADIUS_MIN: AgPolarChartOptions = {
    title: {
        text: 'Market Share',
    },
    data: DATA_MARKET_SHARE,
    series: [
        {
            type: 'pie',
            calloutLabelKey: 'os',
            angleKey: 'share',
            radiusKey: 'satisfaction',
            radiusMin: maxRadius + 2,
        },
    ],
};

export const PIE_SECTORS_DIFFERENT_RADII_SMALL_RADIUS_MAX: AgPolarChartOptions = {
    title: {
        text: 'Market Share',
    },
    data: DATA_MARKET_SHARE,
    series: [
        {
            type: 'pie',
            calloutLabelKey: 'os',
            angleKey: 'share',
            radiusKey: 'satisfaction',
            radiusMax: minRadius - 2,
        },
    ],
};

export const PIE_SECTORS_DIFFERENT_RADII_LARGE_RADIUS_MAX: AgPolarChartOptions = {
    title: {
        text: 'Market Share',
    },
    data: DATA_MARKET_SHARE,
    series: [
        {
            type: 'pie',
            calloutLabelKey: 'os',
            angleKey: 'share',
            radiusKey: 'satisfaction',
            radiusMax: maxRadius + 2,
        },
    ],
};

export const PIE_SECTORS_LABELS: AgPolarChartOptions = {
    title: {
        text: 'Market Share',
    },
    data: DATA_MARKET_SHARE,
    series: [
        {
            type: 'pie',
            calloutLabelKey: 'os',
            angleKey: 'share',
            sectorLabelKey: 'share',
            sectorLabel: {
                color: 'white',
            },
        },
    ],
};

export const DONUT_SERIES: AgPolarChartOptions = {
    title: {
        text: 'Market Share',
    },
    data: DATA_MARKET_SHARE,
    series: [
        {
            type: 'donut',
            calloutLabelKey: 'os',
            angleKey: 'share',
            innerRadiusOffset: -70,
        },
    ],
};

export const DONUT_SERIES_INNER_TEXT: AgPolarChartOptions = {
    title: {
        text: 'Market Share',
    },
    data: DATA_MARKET_SHARE,
    series: [
        {
            type: 'donut',
            calloutLabelKey: 'os',
            angleKey: 'share',
            innerRadiusOffset: -30,
            innerLabels: [
                { text: '35%', color: 'white', fontSize: 50 },
                { text: 'Market', spacing: 10 },
            ],
            innerCircle: {
                fill: '#a3a2a1',
            },
        },
    ],
};

export const DONUT_SERIES_INNER_CIRCLE_CORNER_RADIUS: AgPolarChartOptions = {
    title: {
        text: 'Market Share',
    },
    data: DATA_MARKET_SHARE,
    series: [
        {
            type: 'donut',
            angleKey: 'share',
            innerRadiusRatio: 0.9,
            cornerRadius: 20,
            sectorSpacing: 1,
            innerCircle: {
                fill: '#c9fdc9',
            },
        },
    ],
};

// Wide spacing over a deep ring: the filled band has to cover the spacing strips too, or they read
// as slots cut into it.
export const DONUT_SERIES_INNER_CIRCLE_CORNER_RADIUS_SPACED: AgPolarChartOptions = {
    title: {
        text: 'Market Share',
    },
    data: DATA_MARKET_SHARE,
    series: [
        {
            type: 'donut',
            angleKey: 'share',
            innerRadiusRatio: 0.7,
            cornerRadius: 30,
            sectorSpacing: 3,
            innerCircle: {
                fill: '#c9fdc9',
            },
        },
    ],
};

// A wide `sectorSpacing` insets each sector's painted edges, so the band has to stop where the
// sectors' own outer edge does rather than at the requested corner radius.
export const DONUT_SERIES_INNER_CIRCLE_CORNER_RADIUS_WIDE_SPACING: AgPolarChartOptions = {
    title: {
        text: 'Market Share',
    },
    data: DATA_MARKET_SHARE,
    series: [
        {
            type: 'donut',
            angleKey: 'share',
            innerRadiusRatio: 0.9,
            cornerRadius: 20,
            sectorSpacing: 20,
            innerCircle: {
                fill: '#c9fdc9',
            },
        },
    ],
};

// Translucent sector fills composite over whatever sits behind them, so the band under the sectors
// must be erased - anywhere it survives it tints the slice.
export const DONUT_SERIES_INNER_CIRCLE_CORNER_RADIUS_TRANSLUCENT: AgPolarChartOptions = {
    title: {
        text: 'Market Share',
    },
    data: DATA_MARKET_SHARE,
    series: [
        {
            type: 'donut',
            angleKey: 'share',
            innerRadiusRatio: 0.7,
            cornerRadius: 30,
            sectorSpacing: 1,
            fillOpacity: 0.4,
            innerCircle: {
                fill: '#c9fdc9',
            },
        },
    ],
};

export const DONUT_SERIES_RATIO: AgPolarChartOptions = {
    title: {
        text: 'Market Share',
    },
    data: DATA_MARKET_SHARE,
    series: [
        {
            type: 'donut',
            sectorLabelKey: 'share',
            angleKey: 'share',
            outerRadiusRatio: 0.9,
            innerRadiusRatio: 0.2,
            sectorLabel: {
                positionRatio: 0.7,
            },
        },
    ],
};

export const GROUPED_DONUT_SERIES: AgPolarChartOptions = {
    title: {
        text: 'Market Share',
    },
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
            outerRadiusOffset: -100,
            innerRadiusOffset: -140,
        },
    ],
};

export const DONUT_SERIES_DIFFERENT_RADII: AgPolarChartOptions = {
    title: {
        text: 'Market Share',
    },
    data: DATA_MARKET_SHARE,
    series: [
        {
            type: 'donut',
            title: {
                text: 'Market Share',
            },
            calloutLabelKey: 'os',
            angleKey: 'share',
            radiusKey: 'satisfaction',
            innerRadiusOffset: -100,
        },
    ],
};

export const GROUPED_DONUT_SERIES_DIFFERENT_RADII: AgPolarChartOptions = {
    title: {
        text: 'Market Share',
    },
    data: DATA_MARKET_SHARE,
    series: [
        {
            type: 'donut',
            title: {
                text: 'Market Share',
            },
            calloutLabelKey: 'os',
            angleKey: 'share',
            radiusKey: 'satisfaction',
            innerRadiusOffset: -100,
        },
        {
            type: 'donut',
            title: {
                text: 'Satisfaction',
            },
            calloutLabelKey: 'os',
            angleKey: 'satisfaction',
            radiusKey: 'satisfaction',
            outerRadiusOffset: -150,
            innerRadiusOffset: -250,
        },
    ],
};

export const PIE_CALLOUT_LABELS_COLLISIONS: AgPolarChartOptions = {
    title: {
        text: 'Many Long Labels',
    },
    data: DATA_MANY_LONG_LABELS,
    series: [
        {
            type: 'pie',
            angleKey: 'value',
            calloutLabelKey: 'label',
            calloutLabel: {
                minAngle: 1,
            },
        },
    ],
};

export const DONUT_VARIABLE_RADIUS_CALLOUT_COLLISIONS: AgPolarChartOptions = {
    title: {
        text: 'Revenue Distribution vs. Profit Margin',
    },
    data: DATA_VARIABLE_RADIUS_REVENUE,
    series: [
        {
            type: 'donut',
            angleKey: 'value',
            radiusKey: 'profitMargin',
            calloutLabelKey: 'category',
            innerRadiusRatio: 0.35,
        },
    ],
    legend: {
        position: 'right',
    },
};
