import { type WithThemeParams, _ModuleSupport } from 'ag-charts-community';
import type { RequiredInternalAgGradientColor } from 'ag-charts-core';

const {
    ThemeConstants: { POLAR_AXIS_TYPE },
} = _ModuleSupport;

const BASE_RADAR_SERIES_THEME: _ModuleSupport.SeriesModule<'radar-line' | 'radar-area'>['themeTemplate'] = {
    series: {
        stroke: { $palette: 'stroke' },
        label: {
            enabled: false,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'textColor' },
        },
        marker: {
            enabled: true,
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
            fillImageDefaults: _ModuleSupport.FILL_IMAGE_DEFAULTS,
            fillOpacity: 1,
            shape: 'circle',
            size: 6,
            strokeOpacity: 1,
            strokeWidth: 0,
        },
    },
    axes: {
        [POLAR_AXIS_TYPE.ANGLE_CATEGORY]: {
            label: {
                spacing: 10,
            },
        },
    },
};

export const RADAR_LINE_SERIES_THEME: _ModuleSupport.SeriesModule<'radar-line'>['themeTemplate'] =
    _ModuleSupport.mergeDefaults(
        {
            series: {
                stroke: _ModuleSupport.SAFE_STROKE_FILL_OPERATION,
                strokeWidth: 2,
            },
        },
        BASE_RADAR_SERIES_THEME
    );

export const RADAR_AREA_SERIES_THEME: _ModuleSupport.SeriesModule<'radar-area'>['themeTemplate'] =
    _ModuleSupport.mergeDefaults(
        {
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
                fillImageDefaults: _ModuleSupport.FILL_IMAGE_DEFAULTS,
                fillOpacity: 0.8,
                strokeWidth: 2,
                marker: {
                    enabled: false,
                    fillGradientDefaults: {
                        type: 'gradient',
                        gradient: 'radial',
                        bounds: 'item',
                        colorStops: { $palette: 'gradient' },
                        rotation: 0,
                        reverse: true,
                    } satisfies WithThemeParams<RequiredInternalAgGradientColor>,
                    fillPatternDefaults: _ModuleSupport.FILL_PATTERN_DEFAULTS,
                    fillImageDefaults: _ModuleSupport.FILL_IMAGE_DEFAULTS,
                },
            },
        },
        BASE_RADAR_SERIES_THEME
    );
