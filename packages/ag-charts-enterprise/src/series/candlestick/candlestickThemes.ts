import { _Theme } from 'ag-charts-community';

export const CANDLESTICK_SERIES_THEME = {
    series: {
        highlightStyle: {
            item: { strokeWidth: 3 },
        },
    },
    animation: { enabled: false },
    axes: {
        [_Theme.CARTESIAN_AXIS_TYPE.NUMBER]: {
            crosshair: {
                snap: false,
            },
        },
        [_Theme.CARTESIAN_AXIS_TYPE.ORDINAL_TIME]: {
            groupPaddingInner: 0,
            crosshair: {
                enabled: true,
            },
        },
    },
};
