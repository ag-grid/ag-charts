import { type WithThemeParams, _ModuleSupport } from 'ag-charts-community';
import type { RequiredInternalAgGradientColor } from 'ag-charts-core';

export const RANGE_AREA_SERIES_THEME: _ModuleSupport.SeriesModule<'range-area'>['themeTemplate'] = {
    series: {
        fill: { $palette: 'fill' },
        fillGradientDefaults: {
            type: 'gradient',
            gradient: 'linear',
            bounds: 'item',
            colorStops: { $palette: 'gradient' },
            rotation: 0,
            reverse: false,
        } satisfies WithThemeParams<RequiredInternalAgGradientColor>,
        fillPatternDefaults: _ModuleSupport.FILL_PATTERN_DEFAULTS,
        stroke: { $palette: 'stroke' },
        fillOpacity: 0.7,
        nodeClickRange: 'nearest',
        marker: {
            enabled: false,
            fill: { $palette: 'fill' },
            stroke: { $palette: 'stroke' },
            // @ts-expect-error undocumented option
            fillGradientDefaults: {
                type: 'gradient',
                gradient: 'radial',
                bounds: 'item',
                colorStops: { $palette: 'gradient' },
                rotation: 0,
                reverse: true,
            } satisfies WithThemeParams<RequiredInternalAgGradientColor>,
            fillPatternDefaults: _ModuleSupport.FILL_PATTERN_DEFAULTS,
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
        },
    },
    axes: {
        [_ModuleSupport.ThemeConstants.CARTESIAN_AXIS_TYPE.NUMBER]: {
            crosshair: { enabled: true },
        },
    },
};
