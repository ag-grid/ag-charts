import {
    DEFAULT_SHADOW_COLOUR,
    FILL_GRADIENT_LINEAR_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    LABEL_BOXING_DEFAULTS,
} from 'ag-charts-core';
import type { ExtensibleTheme } from 'ag-charts-types';

export const PYRAMID_SERIES_THEME: ExtensibleTheme<'pyramid'> = {
    series: {
        direction: 'vertical',
        strokeWidth: { $isUserOption: ['./strokes/0', 2, 0] },
        spacing: 2,
        fills: {
            $applyCycle: [
                { $size: { $path: ['./data', { $path: '/data' }] } },
                { $palette: 'fills' },
                {
                    $applySwitch: [
                        { $path: ['/type', undefined, { $value: '$1' }] },
                        { $value: '$1' },
                        ['gradient', FILL_GRADIENT_LINEAR_DEFAULTS],
                        ['pattern', FILL_PATTERN_DEFAULTS],
                        ['image', FILL_IMAGE_DEFAULTS],
                    ],
                },
            ],
        },
        strokes: {
            $applyCycle: [{ $size: { $path: ['./data', { $path: '/data' }] } }, { $palette: 'strokes' }],
        },
        label: {
            ...LABEL_BOXING_DEFAULTS,
            enabled: true,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'chartBackgroundColor' },
        },
        stageLabel: {
            ...LABEL_BOXING_DEFAULTS,
            enabled: true,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'textColor' },
            spacing: 12,
        },
        shadow: {
            enabled: false,
            color: DEFAULT_SHADOW_COLOUR,
            xOffset: 3,
            yOffset: 3,
            blur: 5,
        },
        highlight: {
            enabled: { $path: ['/highlight/enabled', true] },
            unhighlightedItem: {
                opacity: 0.4,
            },
        },
    },
};
