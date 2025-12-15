import {
    FILL_GRADIENT_LINEAR_DEFAULTS,
    FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    LABEL_BOXING_DEFAULTS,
    MARKER_SERIES_HIGHLIGHT_STYLE,
    POLAR_AXIS_TYPE,
    SAFE_STROKE_FILL_OPERATION,
    mergeDefaults,
} from 'ag-charts-core';
import type { ExtensibleTheme } from 'ag-charts-types';

const BASE_RADAR_SERIES_THEME: ExtensibleTheme<'radar-line' | 'radar-area'> = {
    series: {
        stroke: { $palette: 'stroke' },
        label: {
            ...LABEL_BOXING_DEFAULTS,
            enabled: false,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'textColor' },
        },
        marker: {
            enabled: true,
            fill: {
                $applySwitch: [
                    { $path: 'type' },
                    { $palette: 'fill' },
                    ['gradient', FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS],
                    ['image', FILL_IMAGE_DEFAULTS],
                    ['pattern', FILL_PATTERN_DEFAULTS],
                ],
            },
            stroke: { $palette: 'stroke' },
            fillOpacity: 1,
            shape: 'circle',
            size: 6,
            strokeOpacity: 1,
            strokeWidth: { $isUserOption: ['./stroke', 1, 0] },
        },
        highlight: MARKER_SERIES_HIGHLIGHT_STYLE,
        tooltip: {
            range: { $path: ['/tooltip/range', 'nearest'] },
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

export const RADAR_LINE_SERIES_THEME: ExtensibleTheme<'radar-line'> = mergeDefaults(
    {
        series: {
            stroke: SAFE_STROKE_FILL_OPERATION,
            strokeWidth: 2,
        },
    },
    BASE_RADAR_SERIES_THEME
);

export const RADAR_AREA_SERIES_THEME: ExtensibleTheme<'radar-area'> = mergeDefaults(
    {
        series: {
            fill: {
                $applySwitch: [
                    { $path: 'type' },
                    { $palette: 'fill' },
                    ['gradient', FILL_GRADIENT_LINEAR_DEFAULTS],
                    ['image', FILL_IMAGE_DEFAULTS],
                    ['pattern', FILL_PATTERN_DEFAULTS],
                ],
            },
            fillOpacity: 0.8,
            strokeWidth: 2,
            marker: {
                enabled: false,
            },
        },
    },
    BASE_RADAR_SERIES_THEME
);
