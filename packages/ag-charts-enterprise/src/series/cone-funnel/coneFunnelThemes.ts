import { type AgAxisLabelFormatterParams, type WithThemeParams, _ModuleSupport } from 'ag-charts-community';
import type { RequiredInternalAgGradientColor } from 'ag-charts-core';

const {
    ThemeConstants: { CARTESIAN_AXIS_TYPE },
} = _ModuleSupport;

export const CONE_FUNNEL_SERIES_THEME: _ModuleSupport.SeriesModule<'cone-funnel'>['themeTemplate'] = {
    series: {
        direction: 'vertical',
        fills: {
            $if: [
                { $eq: [{ $palette: 'type' }, 'inbuilt'] },
                { $palette: 'secondSequentialColors' },
                _ModuleSupport.SAFE_RANGE2_OPERATION,
            ],
        },
        strokes: {
            $if: [
                { $eq: [{ $palette: 'type' }, 'inbuilt'] },
                { $palette: 'secondSequentialColors' },
                _ModuleSupport.SAFE_RANGE2_OPERATION,
            ],
        },
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
            enabled: true,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'textColor' },
            placement: 'before',
            spacing: 4,
        },
    },
    seriesArea: {
        padding: {
            top: 20,
            bottom: 20,
        },
    },
    axes: {
        [CARTESIAN_AXIS_TYPE.NUMBER]: {
            nice: false,
            gridLine: {
                enabled: false,
            },
            crosshair: {
                enabled: false,
            },
            label: {
                enabled: false,
                formatter(params: AgAxisLabelFormatterParams) {
                    return Math.abs(params.value).toFixed(params.fractionDigits ?? 0);
                },
            },
        },
        [CARTESIAN_AXIS_TYPE.CATEGORY]: {
            line: {
                enabled: false,
            },
        },
    },
};
