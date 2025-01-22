import { _ModuleSupport } from 'ag-charts-community';

export const RANGE_AREA_SERIES_THEME: _ModuleSupport.SeriesModule<'range-area'>['themeTemplate'] = {
    series: {
        fillOpacity: 0.7,
        nodeClickRange: 'nearest',
        marker: {
            enabled: false,
            size: 6,
            strokeWidth: 2,
        },
        label: {
            enabled: false,
            placement: 'outside',
            padding: 10,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            color: { $ref: 'foregroundColor' },
        },
        interpolation: {
            type: 'linear',
            tension: 1,
            position: 'end',
        },
    },
    axes: {
        [_ModuleSupport.ThemeConstants.CARTESIAN_AXIS_TYPE.NUMBER]: {
            crosshair: { enabled: true },
        },
    },
};
