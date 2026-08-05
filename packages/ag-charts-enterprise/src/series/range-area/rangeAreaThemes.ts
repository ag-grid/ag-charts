import { type AgChartThemeOverrides, type WithThemeParams } from 'ag-charts-community';
import {
    CARTESIAN_AXIS_TYPE,
    FILL_GRADIENT_LINEAR_DEFAULTS,
    FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    LABEL_BOXING_TOP_LEVEL_DEFAULTS,
    LABEL_OVERFLOW_ALWAYS_SHOW,
    LABEL_OVERFLOW_DEFAULTS,
    LABEL_PLACEMENT_STYLE_DEFAULTS,
    MARKER_SERIES_HIGHLIGHT_STYLE,
    type NonNullablePath,
    SEGMENTATION_DEFAULTS,
    SERIES_SELECTION_THEME,
} from 'ag-charts-core';

type RangeAreaItemOptions = NonNullablePath<AgChartThemeOverrides, 'range-area', 'series', 'item'>;

const RANGE_AREA_ITEM: WithThemeParams<RangeAreaItemOptions[keyof RangeAreaItemOptions]> = {
    lineDash: {
        $path: '/series/$index/lineDash',
    },
    lineDashOffset: {
        $path: '/series/$index/lineDashOffset',
    },
    stroke: {
        $path: ['/series/$index/stroke', { $palette: 'stroke' }],
    },
    strokeOpacity: {
        $path: '/series/$index/strokeOpacity',
    },
    strokeWidth: {
        $path: ['/series/$index/strokeWidth', 1],
    },
    marker: {
        enabled: {
            $path: '/series/$index/marker/enabled',
        },
        fill: {
            $isUserOption: [
                '/series/$index/marker/fill',
                {
                    $if: [
                        {
                            $or: [
                                { $isGradient: { $path: '/series/$index/marker/fill' } },
                                { $isImage: { $path: '/series/$index/marker/fill' } },
                                { $isPattern: { $path: '/series/$index/marker/fill' } },
                            ],
                        },
                        {
                            $merge: [
                                { $path: '/series/$index/marker/fill' },
                                {
                                    $applySwitch: [
                                        { $path: 'type' },
                                        undefined, // default case shouldn't be hit because of $if
                                        ['gradient', FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS],
                                        ['image', FILL_IMAGE_DEFAULTS],
                                        ['pattern', FILL_PATTERN_DEFAULTS],
                                    ],
                                },
                            ],
                        },
                        {
                            $isUserOption: [
                                '/series/$index/marker/fill',
                                { $path: '/series/$index/marker/fill' },
                                { $palette: 'fill' },
                            ],
                        },
                    ],
                },

                {
                    $applySwitch: [
                        { $path: 'type' },
                        { $palette: 'fill' },
                        ['gradient', FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS],
                        ['image', FILL_IMAGE_DEFAULTS],
                        ['pattern', FILL_PATTERN_DEFAULTS],
                    ],
                },
            ],
        },
        fillOpacity: {
            $path: '/series/$index/marker/fillOpacity',
        },
        lineDash: {
            $path: '/series/$index/marker/lineDash',
        },
        lineDashOffset: {
            $path: '/series/$index/marker/lineDashOffset',
        },
        shape: {
            $path: '/series/$index/marker/shape',
        },
        size: {
            $path: ['/series/$index/marker/size', 6],
        },
        stroke: {
            $path: ['/series/$index/marker/stroke', { $palette: 'stroke' }],
        },
        strokeOpacity: {
            $path: '/series/$index/marker/strokeOpacity',
        },
        strokeWidth: {
            $path: ['/series/$index/marker/strokeWidth', 2],
        },
    },
};

export const RANGE_AREA_SERIES_THEME: WithThemeParams<AgChartThemeOverrides['range-area']> = {
    series: {
        fill: {
            $applySwitch: [
                { $path: 'type' },
                { $palette: 'fill' },
                ['gradient', FILL_GRADIENT_LINEAR_DEFAULTS],
                ['pattern', FILL_PATTERN_DEFAULTS],
            ],
        },
        fillOpacity: 0.7,
        stroke: { $palette: 'stroke' },
        strokeWidth: 1,
        marker: {
            enabled: false,
            fill: {
                $applySwitch: [
                    { $path: 'type' },
                    { $palette: 'fill' },
                    ['gradient', FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS],
                    ['image', FILL_IMAGE_DEFAULTS],
                    ['pattern', FILL_PATTERN_DEFAULTS],
                ],
            },
            shape: 'circle',
            stroke: { $palette: 'stroke' },
            size: 6,
            strokeWidth: 2,
        },
        nodeClickRange: { $if: [{ $path: '/selection/enabled' }, 10, 'nearest'] },
        item: {
            low: RANGE_AREA_ITEM,
            high: RANGE_AREA_ITEM,
        },
        label: {
            ...LABEL_BOXING_TOP_LEVEL_DEFAULTS,
            ...LABEL_OVERFLOW_DEFAULTS,
            enabled: false,
            placement: 'outside',
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            spacing: 10,
            padding: 10,
            collision: { alwaysShow: LABEL_OVERFLOW_ALWAYS_SHOW },
            insideStyle: LABEL_PLACEMENT_STYLE_DEFAULTS('textColor'),
            outsideStyle: LABEL_PLACEMENT_STYLE_DEFAULTS('textColor'),
        },
        interpolation: {
            type: 'linear',
        },
        tooltip: {
            range: { $path: ['/tooltip/range', 'nearest'] },
        },
        highlight: MARKER_SERIES_HIGHLIGHT_STYLE,
        selection: SERIES_SELECTION_THEME,
        segmentation: SEGMENTATION_DEFAULTS,
        invertedStyle: {
            enabled: false,
            fill: {
                $applySwitch: [
                    { $path: 'type' },
                    { $palette: 'fill' }, // @todo(AG-14792) should be { $path: '../fill' } to inherit from series.fill
                    ['gradient', FILL_GRADIENT_LINEAR_DEFAULTS],
                    ['image', FILL_IMAGE_DEFAULTS],
                    ['pattern', FILL_PATTERN_DEFAULTS],
                ],
            },
            fillOpacity: { $path: '../fillOpacity' },
        },
    },
    axes: {
        [CARTESIAN_AXIS_TYPE.NUMBER]: {
            crosshair: { enabled: true },
        },
    },
};
