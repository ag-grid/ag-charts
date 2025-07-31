import { type AgChartThemeOverrides, type WithThemeParams, _ModuleSupport } from 'ag-charts-community';

export const RANGE_AREA_SERIES_THEME: WithThemeParams<
    AgChartThemeOverrides['range-area'] & { series: { label: { padding: number } } }
> = {
    series: {
        fill: {
            $applySwitch: [
                { $path: 'type' },
                { $palette: 'fill' },
                ['gradient', _ModuleSupport.FILL_GRADIENT_LINEAR_DEFAULTS],
                ['pattern', _ModuleSupport.FILL_PATTERN_DEFAULTS],
            ],
        },
        stroke: { $palette: 'stroke' },
        fillOpacity: 0.7,
        nodeClickRange: 'nearest',
        marker: {
            enabled: false,
            fill: {
                $applySwitch: [
                    { $path: 'type' },
                    { $palette: 'fill' },
                    ['gradient', _ModuleSupport.FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS],
                    ['image', _ModuleSupport.FILL_IMAGE_DEFAULTS],
                    ['pattern', _ModuleSupport.FILL_PATTERN_DEFAULTS],
                ],
            },
            stroke: { $palette: 'stroke' },
            size: 6,
            strokeWidth: 2,
        },
        label: {
            ..._ModuleSupport.LABEL_BOXING_DEFAULTS,
            enabled: false,
            placement: 'outside',
            padding: { $isUserOption: ['./spacing', 0, 10] }, // compatibility with old `padding` property (now named `spacing`).
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'textColor' },
        },
        interpolation: {
            type: 'linear',
        },
        tooltip: {
            range: { $path: ['/tooltip/range', 'nearest'] },
        },
        highlight: _ModuleSupport.multiSeriesHighlightStyle(),
    },
    axes: {
        [_ModuleSupport.ThemeConstants.CARTESIAN_AXIS_TYPE.NUMBER]: {
            crosshair: { enabled: true },
        },
    },
};
