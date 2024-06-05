import { _Theme } from 'ag-charts-community';

const itemTheme = {
    strokeWidth: 0,
    label: {
        enabled: false,
        fontStyle: undefined,
        fontWeight: _Theme.FONT_WEIGHT.NORMAL,
        fontSize: 12,
        fontFamily: _Theme.DEFAULT_FONT_FAMILY,
        color: _Theme.DEFAULT_LABEL_COLOUR,
        formatter: undefined,
        placement: 'end' as const,
    },
};

export const WATERFALL_SERIES_THEME = {
    series: {
        item: {
            positive: itemTheme,
            negative: itemTheme,
            total: itemTheme,
        },
        line: {
            stroke: _Theme.DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
            strokeOpacity: 1,
            lineDash: [0],
            lineDashOffset: 0,
            strokeWidth: 2,
        },
    },
    legend: {
        enabled: true,
        toggleSeries: false,
    },
};
