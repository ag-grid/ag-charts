import { _Theme } from 'ag-charts-community';

export const CANDLESTICK_SERIES_THEME = {
    series: {
        visible: true,
        showInLegend: true,
        highlightStyle: {
            item: { fill: '#ffffff54', stroke: `#0006`, strokeWidth: 3 },
            series: { dimOpacity: 1 },
        },
        nodeClickRange: 'exact',
        tooltip: { enabled: true },
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
