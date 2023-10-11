import { _Theme } from 'ag-charts-community';

export const WATERFALL_SERIES_THEME = {
    __extends__: _Theme.EXTENDS_SERIES_DEFAULTS,
    item: {
        positive: {
            __extends__: _Theme.DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS,
            strokeWidth: 0,
            label: {
                enabled: false,
            },
        },
        negative: {
            __extends__: _Theme.DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
            strokeWidth: 0,
            label: {
                enabled: false,
            },
        },
        total: {
            __extends__: _Theme.DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS,
            strokeWidth: 0,
            label: {
                enabled: false,
            },
        },
    },
    line: {
        stroke: _Theme.DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
        strokeOpacity: 1,
        lineDash: [0],
        lineDashOffset: 0,
        strokeWidth: 2,
    },
};
