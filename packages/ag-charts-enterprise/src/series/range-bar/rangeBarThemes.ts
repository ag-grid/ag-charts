import { type AgGradientColor, _ModuleSupport } from 'ag-charts-community';

export const RANGE_BAR_SERIES_THEME: _ModuleSupport.SeriesModule<'range-bar'>['themeTemplate'] = {
    series: {
        direction: 'vertical' as const,
        fill: { $palette: 'fill' },
        stroke: { $palette: 'stroke' },
        // @ts-expect-error undocumented option
        fillGradientDefaults: {
            type: 'gradient',
            gradient: 'linear',
            bounds: 'item',
            colorStops: { $palette: 'gradient' } as any,
            rotation: 0,
            reverse: false,
        } satisfies Required<AgGradientColor>,
        strokeWidth: 0,
        label: {
            enabled: false,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'backgroundColor' },
            placement: 'inside',
        },
    },
    axes: {
        [_ModuleSupport.ThemeConstants.CARTESIAN_AXIS_TYPE.NUMBER]: {
            crosshair: { enabled: true },
        },
    },
};
