import { type AgAxisLabelFormatterParams, type WithThemeParams, _ModuleSupport } from 'ag-charts-community';
import type { InternalAgGradientColor } from 'ag-charts-core';

const {
    ThemeConstants: { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION },
    ThemeSymbols: { DEFAULT_SHADOW_COLOUR },
} = _ModuleSupport;

// TODO: Fix `WithThemeParams` to handle top level operation when T = []
// type CartesianAxis = Exclude<AgCartesianChartOptions['axes'], undefined>[0];
// WithThemeParams<[CartesianAxis, CartesianAxis]>

export const FUNNEL_SERIES_AXES: any = {
    $if: [
        { $eq: [{ $path: ['/direction', undefined] }, 'horizontal'] },
        [
            {
                type: CARTESIAN_AXIS_TYPE.NUMBER,
                position: CARTESIAN_POSITION.LEFT,
            },
            {
                type: CARTESIAN_AXIS_TYPE.CATEGORY,
                position: {
                    $if: [
                        { $eq: [{ $path: ['/stageLabel/placement', undefined] }, 'before'] },
                        CARTESIAN_POSITION.TOP,
                        CARTESIAN_POSITION.BOTTOM,
                    ],
                },
                label: { $omit: [['placement'], { $path: ['/stageLabel', undefined] }] },
            },
        ],
        [
            {
                type: CARTESIAN_AXIS_TYPE.CATEGORY,
                position: {
                    $if: [
                        { $eq: [{ $path: ['/stageLabel/placement', undefined] }, 'after'] },
                        CARTESIAN_POSITION.RIGHT,
                        CARTESIAN_POSITION.LEFT,
                    ],
                },
                label: { $omit: [['placement'], { $path: ['/stageLabel', undefined] }] },
            },
            {
                type: CARTESIAN_AXIS_TYPE.NUMBER,
                position: CARTESIAN_POSITION.BOTTOM,
            },
        ],
    ],
};

export const FUNNEL_SERIES_THEME: _ModuleSupport.SeriesModule<'funnel'>['themeTemplate'] = {
    series: {
        direction: 'vertical',
        strokeWidth: 0,
        spacingRatio: 0.25,
        fills: [{ $palette: 'fill' }],
        strokes: [{ $palette: 'stroke' }],
        // @ts-expect-error undocumented option
        fillGradientDefaults: {
            type: 'gradient',
            gradient: 'linear',
            bounds: 'item',
            colorStops: { $palette: 'gradient' },
            rotation: 0,
            reverse: false,
        } satisfies WithThemeParams<Required<InternalAgGradientColor>>,
        fillPatternDefaults: _ModuleSupport.FILL_PATTERN_DEFAULTS,
        label: {
            enabled: true,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'backgroundColor' },
        },
        dropOff: {
            enabled: true,
            fillOpacity: 0.2,
            strokeWidth: 0,
        },
        shadow: {
            enabled: false,
            color: DEFAULT_SHADOW_COLOUR,
            xOffset: 3,
            yOffset: 3,
            blur: 5,
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
