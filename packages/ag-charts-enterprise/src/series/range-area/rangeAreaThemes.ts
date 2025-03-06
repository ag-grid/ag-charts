import { _ModuleSupport } from 'ag-charts-community';

export const RANGE_AREA_SERIES_THEME: _ModuleSupport.SeriesModule<'range-area'>['themeTemplate'] = {
    series: {
        fill: { $palette: 'fill' },
        stroke: { $palette: 'stroke' },
        defaultColorRange: { $palette: 'gradient' },
        fillOpacity: 0.7,
        nodeClickRange: 'nearest',
        marker: {
            enabled: false,
            fill: { $palette: 'fill' },
            stroke: { $palette: 'stroke' },
            // @ts-expect-error undocumented option
            defaultColorRange: { $palette: 'gradient' },
            size: 6,
            strokeWidth: 2,
        },
        label: {
            enabled: false,
            placement: 'outside',
            padding: 10,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'textColor' },
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
