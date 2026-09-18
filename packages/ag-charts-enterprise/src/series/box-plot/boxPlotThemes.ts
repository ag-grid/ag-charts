import {
    CARTESIAN_AXIS_TYPE,
    COMMON_SERIES_THEME_DEFAULTS,
    FILL_GRADIENT_LINEAR_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    SAFE_FILL_OPERATION,
    SEGMENTATION_DEFAULTS,
    SERIES_SELECTION_THEME,
} from 'ag-charts-core';
import type { ExtensibleSeriesTheme } from 'ag-charts-types';

export const BOX_PLOT_SERIES_THEME: ExtensibleSeriesTheme<'box-plot'> = {
    series: {
        ...COMMON_SERIES_THEME_DEFAULTS,
        direction: 'vertical',
        fill: {
            $applySwitch: [
                { $path: 'type' },
                {
                    $if: [
                        {
                            $or: [
                                { $isGradient: { $palette: 'fill' } },
                                { $isPattern: { $palette: 'fill' } },
                                { $isImage: { $palette: 'fill' } },
                            ],
                        },
                        { $palette: 'fill' },
                        { $mix: [SAFE_FILL_OPERATION, { $ref: 'chartBackgroundColor' }, 0.7] },
                    ],
                },
                ['gradient', FILL_GRADIENT_LINEAR_DEFAULTS],
                ['image', FILL_IMAGE_DEFAULTS],
                ['pattern', FILL_PATTERN_DEFAULTS],
            ],
        },
        stroke: { $palette: 'stroke' },
        strokeWidth: 2,
        fillOpacity: 1,
        strokeOpacity: 1,
        lineDash: [0],
        lineDashOffset: 0,
        cornerRadius: 0,
        cap: { lengthRatio: 0.5 },
        tooltip: { interaction: { enabled: false } },
        highlight: {
            enabled: { $path: ['/highlight/enabled', true] },
            bringToFront: true,
            unhighlightedItem: {
                opacity: 0.5,
            },
            unhighlightedSeries: {
                opacity: 0.1,
            },
        },
        selection: SERIES_SELECTION_THEME,
        segmentation: SEGMENTATION_DEFAULTS,
    },
    axes: {
        [CARTESIAN_AXIS_TYPE.NUMBER]: {
            crosshair: {
                snap: false,
            },
        },
        [CARTESIAN_AXIS_TYPE.CATEGORY]: {
            groupPaddingInner: 0.2,
            crosshair: {
                enabled: false,
                snap: false,
            },
        },
    },
};
