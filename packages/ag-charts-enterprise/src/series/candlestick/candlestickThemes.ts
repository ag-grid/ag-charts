import { _Theme } from 'ag-charts-community';

export const CANDLESTICK_SERIES_THEME = {
    series: {
        __extends__: _Theme.EXTENDS_SERIES_DEFAULTS,
    },
    axes: {
        [_Theme.CARTESIAN_AXIS_TYPE.NUMBER]: {
            crosshair: {
                snap: false,
            },
        },
        [_Theme.CARTESIAN_AXIS_TYPE.ORDINAL_TIME]: {
            groupPaddingInner: 0.2,
            crosshair: {
                enabled: true,
            },
        },
    },
};
