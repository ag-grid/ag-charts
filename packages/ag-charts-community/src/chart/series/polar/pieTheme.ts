import {
    COMMON_SERIES_THEME_DEFAULTS,
    DEFAULT_SHADOW_COLOUR,
    FILL_GRADIENT_RADIAL_REVERSED_SERIES_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    FONT_SIZE_RATIO,
    LABEL_BOXING_DEFAULTS,
    LABEL_OVERFLOW_DEFAULTS,
    PART_WHOLE_HIGHLIGHT_STYLE,
    SERIES_SELECTION_THEME,
    STROKE_STYLE_THEME_DEFAULTS,
} from 'ag-charts-core';
import type { ExtensibleSeriesTheme } from 'ag-charts-types';

export const pieTheme: ExtensibleSeriesTheme<'pie'> = {
    series: {
        ...COMMON_SERIES_THEME_DEFAULTS,
        title: {
            enabled: true,
            showInLegend: false,
            fontWeight: { $ref: 'fontWeight' },
            fontSize: { $rem: FONT_SIZE_RATIO.LARGE },
            fontFamily: { $ref: 'fontFamily' },
            color: { $ref: 'subtleTextColor' },
            spacing: 5,
        },
        calloutLabel: {
            ...LABEL_BOXING_DEFAULTS,
            ...LABEL_OVERFLOW_DEFAULTS,
            enabled: true,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'textColor' },
            offset: 3,
            minAngle: 0.001,
            avoidCollisions: true,
        },
        sectorLabel: {
            ...LABEL_BOXING_DEFAULTS,
            ...LABEL_OVERFLOW_DEFAULTS,
            enabled: true,
            fontWeight: { $ref: 'fontWeight' },
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            color: { $ref: 'chartBackgroundColor' },
            positionOffset: 0,
            positionRatio: 0.5,
        },
        calloutLine: {
            length: 10,
            strokeWidth: 2,
            colors: {
                $map: [
                    {
                        $if: [
                            {
                                $or: [
                                    { $isGradient: { $value: '$1' } },
                                    { $isPattern: { $value: '$1' } },
                                    { $isImage: { $value: '$1' } },
                                ],
                            },
                            { $path: ['../../strokes/$index', { $ref: 'foregroundColor' }] },
                            { $value: '$1' },
                        ],
                    },
                    {
                        $if: [
                            { $eq: [{ $path: '../strokeWidth' }, 0] },
                            { $path: '../fills' },
                            { $path: '../strokes' },
                        ],
                    },
                ],
            },
        },
        fills: {
            $applyCycle: [
                { $cacheMax: { $size: { $path: ['./data', { $path: '/data' }] } } },
                { $palette: 'fills' },
                {
                    $applySwitch: [
                        { $path: ['/type', undefined, { $value: '$1' }] },
                        { $value: '$1' },
                        ['gradient', FILL_GRADIENT_RADIAL_REVERSED_SERIES_DEFAULTS],
                        ['pattern', FILL_PATTERN_DEFAULTS],
                        ['image', FILL_IMAGE_DEFAULTS],
                    ],
                },
            ],
        },
        strokes: {
            $applyCycle: [{ $cacheMax: { $size: { $path: ['./data', { $path: '/data' }] } } }, { $palette: 'strokes' }],
        },
        fillOpacity: 1,
        ...STROKE_STYLE_THEME_DEFAULTS,
        strokeWidth: { $isUserOption: ['./strokes/0', 2, 0] },
        cornerRadius: 0,
        rotation: 0,
        outerRadiusOffset: 0,
        outerRadiusRatio: 1,
        sectorSpacing: 1,
        hideZeroValueSectorsInLegend: false,
        shadow: {
            enabled: false,
            color: DEFAULT_SHADOW_COLOUR,
            xOffset: 3,
            yOffset: 3,
            blur: 5,
        },
        tooltip: { interaction: { enabled: false } },
        highlight: { ...PART_WHOLE_HIGHLIGHT_STYLE, bringToFront: true },
        selection: SERIES_SELECTION_THEME,
    },
    legend: { enabled: true },
};
