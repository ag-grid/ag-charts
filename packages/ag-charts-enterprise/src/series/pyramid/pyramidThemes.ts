import { type WithThemeParams, _ModuleSupport } from 'ag-charts-community';
import type { RequiredInternalAgGradientColor } from 'ag-charts-core';

const {
    ThemeSymbols: { DEFAULT_SHADOW_COLOUR },
} = _ModuleSupport;

export const PYRAMID_SERIES_THEME: _ModuleSupport.SeriesModule<'pyramid'>['themeTemplate'] = {
    series: {
        direction: 'vertical',
        strokeWidth: 0,
        spacing: 2,
        fills: { $palette: 'fills' },
        strokes: { $palette: 'strokes' },
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
        label: {
            enabled: true,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'backgroundColor' },
        },
        stageLabel: {
            enabled: true,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'textColor' },
            spacing: 12,
        },
        shadow: {
            enabled: false,
            color: DEFAULT_SHADOW_COLOUR,
            xOffset: 3,
            yOffset: 3,
            blur: 5,
        },
    },
};
