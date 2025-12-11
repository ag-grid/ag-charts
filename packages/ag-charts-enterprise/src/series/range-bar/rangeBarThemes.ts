import { type AgChartThemeOverrides, type WithThemeParams } from 'ag-charts-community';
import {
    CARTESIAN_AXIS_TYPE,
    FILL_GRADIENT_LINEAR_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    LABEL_BOXING_DEFAULTS,
    MULTI_SERIES_HIGHLIGHT_STYLE,
    SEGMENTATION_DEFAULTS,
} from 'ag-charts-core';

export const RANGE_BAR_SERIES_THEME: WithThemeParams<
    AgChartThemeOverrides['range-bar'] & { series: { label: { padding: number } } }
> = {
    series: {
        direction: 'vertical' as const,
        fill: {
            $applySwitch: [
                { $path: 'type' },
                { $palette: 'fill' },
                ['gradient', FILL_GRADIENT_LINEAR_DEFAULTS],
                ['image', FILL_IMAGE_DEFAULTS],
                ['pattern', FILL_PATTERN_DEFAULTS],
            ],
        },
        stroke: { $palette: 'stroke' },
        strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
        label: {
            ...LABEL_BOXING_DEFAULTS,
            enabled: false,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'chartBackgroundColor' },
            placement: 'inside',
            padding: { $isUserOption: ['./spacing', 0, 6] }, // compatibility with old `padding` property (now named `spacing`).
        },
        highlight: MULTI_SERIES_HIGHLIGHT_STYLE,
        segmentation: SEGMENTATION_DEFAULTS,
    },
    axes: {
        [CARTESIAN_AXIS_TYPE.NUMBER]: {
            crosshair: { enabled: true },
        },
    },
};
