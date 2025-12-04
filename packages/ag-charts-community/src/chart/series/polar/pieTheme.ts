import { DEFAULT_SHADOW_COLOUR, FONT_SIZE_RATIO } from 'ag-charts-core';
import type { ExtensibleTheme } from 'ag-charts-types';

import {
    FILL_GRADIENT_RADIAL_REVERSED_SERIES_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    LABEL_BOXING_DEFAULTS,
    partWholeHighlightStyle,
} from '../../themes/util';

export const pieTheme: ExtensibleTheme<'pie'> = {
    series: {
        title: {
            enabled: true,
            fontWeight: { $ref: 'fontWeight' },
            fontSize: { $rem: FONT_SIZE_RATIO.LARGE },
            fontFamily: { $ref: 'fontFamily' },
            color: { $ref: 'subtleTextColor' },
            spacing: 5,
        },
        calloutLabel: {
            ...LABEL_BOXING_DEFAULTS,
            enabled: true,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'textColor' },
            offset: 3,
            minAngle: 0.001,
        },
        sectorLabel: {
            ...LABEL_BOXING_DEFAULTS,
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
        strokeOpacity: 1,
        strokeWidth: { $isUserOption: ['./strokes/0', 2, 0] },
        lineDash: [0],
        lineDashOffset: 0,
        rotation: 0,
        sectorSpacing: 1,
        shadow: {
            enabled: false,
            color: DEFAULT_SHADOW_COLOUR,
            xOffset: 3,
            yOffset: 3,
            blur: 5,
        },
        highlight: partWholeHighlightStyle(),
    },
    legend: { enabled: true },
};
