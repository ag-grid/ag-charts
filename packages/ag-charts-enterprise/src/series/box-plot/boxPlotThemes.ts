import {
    CARTESIAN_AXIS_TYPE,
    FILL_GRADIENT_LINEAR_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    SAFE_FILL_OPERATION,
    SEGMENTATION_DEFAULTS,
} from 'ag-charts-core';
import type { ExtensibleTheme } from 'ag-charts-types';

export const BOX_PLOT_SERIES_THEME: ExtensibleTheme<'box-plot'> = {
    series: {
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
        lineDash: undefined,
        lineDashOffset: 0,
        highlight: {
            unhighlightedItem: {
                opacity: 0.5,
            },
            unhighlightedSeries: {
                opacity: 0.1,
            },
        },
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
