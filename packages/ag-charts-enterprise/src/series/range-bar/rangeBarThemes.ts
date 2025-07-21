import { type AgChartThemeOverrides, type WithThemeParams, _ModuleSupport } from 'ag-charts-community';

export const RANGE_BAR_SERIES_THEME: WithThemeParams<
    AgChartThemeOverrides['range-bar'] & { series: { label: { padding: number } } }
> = {
    series: {
        direction: 'vertical' as const,
        fill: { $palette: 'fill' },
        stroke: { $palette: 'stroke' },
        // @ts-expect-error undocumented option
        fillGradientDefaults: _ModuleSupport.FILL_GRADIENT_LINEAR_DEFAULTS,
        fillPatternDefaults: _ModuleSupport.FILL_PATTERN_DEFAULTS,
        fillImageDefaults: _ModuleSupport.FILL_IMAGE_DEFAULTS,
        strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
        label: {
            ..._ModuleSupport.LABEL_BOXING_DEFAULTS,
            enabled: false,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'chartBackgroundColor' },
            placement: 'inside',
            padding: { $isUserOption: ['./spacing', 0, 6] }, // compatibility with old `padding` property (now named `spacing`).
        },
        highlight: _ModuleSupport.multiSeriesHighlightStyle(),
    },
    axes: {
        [_ModuleSupport.ThemeConstants.CARTESIAN_AXIS_TYPE.NUMBER]: {
            crosshair: { enabled: true },
        },
    },
};
