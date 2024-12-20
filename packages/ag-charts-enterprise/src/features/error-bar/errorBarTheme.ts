import { _ModuleSupport } from 'ag-charts-community';

export const ERROR_BARS_THEME: _ModuleSupport.SeriesOptionModule['themeTemplate'] = {
    series: {
        errorBar: {
            visible: true,
            stroke: { ref: 'foregroundColor' },
            strokeWidth: 1,
            strokeOpacity: 1,
            cap: {
                length: undefined,
                lengthRatio: undefined,
            },
        },
    },
};
