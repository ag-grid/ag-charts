import { _ModuleSupport } from 'ag-charts-community';

const { CARTESIAN_AXIS_TYPE } = _ModuleSupport.ThemeConstants;

export const CANDLESTICK_SERIES_THEME = {
    series: {
        highlightStyle: {
            item: { strokeWidth: 3 },
        },
    },
    animation: { enabled: false },
    axes: {
        [CARTESIAN_AXIS_TYPE.NUMBER]: {
            crosshair: {
                snap: false,
            },
        },
        [CARTESIAN_AXIS_TYPE.ORDINAL_TIME]: {
            groupPaddingInner: 0,
            crosshair: {
                enabled: true,
            },
        },
    },
};
