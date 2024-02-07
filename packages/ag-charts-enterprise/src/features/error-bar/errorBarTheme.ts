import { _Theme } from 'ag-charts-community';

export const ERROR_BARS_THEME = {
    series: {
        errorBar: {
            visible: true,
            stroke: _Theme.DEFAULT_LABEL_COLOUR,
            strokeWidth: 1,
            strokeOpacity: 1,
            cap: {
                length: undefined,
                lengthRatio: undefined,
            },
        },
    },
};
