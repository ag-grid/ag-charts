import { type WithThemeParams, _ModuleSupport } from 'ag-charts-community';
import type { RequiredInternalAgGradientColor } from 'ag-charts-core';

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
            colorStops: { $palette: 'gradient' },
            rotation: 0,
            reverse: false,
        } satisfies WithThemeParams<RequiredInternalAgGradientColor>,
        fillPatternDefaults: _ModuleSupport.FILL_PATTERN_DEFAULTS,
        fillImageDefaults: _ModuleSupport.FILL_IMAGE_DEFAULTS,
        strokeWidth: 0,
        label: {
            enabled: false,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'chartBackgroundColor' },
            placement: 'inside',
        },
    },
    axes: {
        [_ModuleSupport.ThemeConstants.CARTESIAN_AXIS_TYPE.NUMBER]: {
            crosshair: { enabled: true },
        },
    },
};
