import { _Theme } from 'ag-charts-community';

export const WATERFALL_SERIES_THEME = {
    __extends__: _Theme.EXTENDS_SERIES_DEFAULTS,
    positiveItem: {
        label: {
            enabled: false,
        },
        fill: '#233e6f',
        stroke: '#233e6f',
    },
    negativeItem: {
        label: {
            enabled: false,
        },
        fill: '#9FB7E1',
        stroke: '#9FB7E1',
    },
    totalItem: {
        label: {
            enabled: false,
        },
        fill: '#79706E',
        stroke: '#79706E',
    },
    line: {
        stroke: 'black',
        strokeOpacity: 1,
        lineDash: [0],
        lineDashOffset: 0,
        strokeWidth: 2,
    },
};
