import { type AgChartThemeOverrides, type WithThemeParams, _ModuleSupport } from 'ag-charts-community';
import { CARTESIAN_AXIS_TYPE } from 'ag-charts-core';

export const RANGE_BAR_SERIES_THEME: WithThemeParams<
    AgChartThemeOverrides['range-bar'] & { series: { label: { padding: number } } }
> = {
    series: {
        direction: 'vertical' as const,
        fill: {
            $applySwitch: [
                { $path: 'type' },
                { $palette: 'fill' },
                ['gradient', _ModuleSupport.FILL_GRADIENT_LINEAR_DEFAULTS],
                ['image', _ModuleSupport.FILL_IMAGE_DEFAULTS],
                ['pattern', _ModuleSupport.FILL_PATTERN_DEFAULTS],
            ],
        },
        stroke: { $palette: 'stroke' },
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
        segmentation: _ModuleSupport.SEGMENTATION_DEFAULTS,
    },
    axes: {
        [CARTESIAN_AXIS_TYPE.NUMBER]: {
            crosshair: { enabled: true },
        },
    },
};
