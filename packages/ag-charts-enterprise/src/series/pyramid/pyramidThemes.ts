import { _ModuleSupport } from 'ag-charts-community';

export const PYRAMID_SERIES_THEME: _ModuleSupport.SeriesModule<'pyramid'>['themeTemplate'] = {
    series: {
        direction: 'vertical',
        strokeWidth: 0,
        spacing: 2,
        label: {
            enabled: true,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            color: { $ref: 'backgroundColor' },
        },
        stageLabel: {
            enabled: true,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            color: { $ref: 'foregroundColor' },
            spacing: 12,
        },
    },
};
