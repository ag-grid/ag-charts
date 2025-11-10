import { _ModuleSupport } from 'ag-charts-community';
import type { ExtensibleTheme } from 'ag-charts-types';

const {
    ThemeSymbols: { DEFAULT_SHADOW_COLOUR },
} = _ModuleSupport;

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
                        ['gradient', _ModuleSupport.FILL_GRADIENT_LINEAR_DEFAULTS],
                        ['pattern', _ModuleSupport.FILL_PATTERN_DEFAULTS],
                        ['image', _ModuleSupport.FILL_IMAGE_DEFAULTS],
                    ],
                },
            ],
        },
        strokes: {
            $applyCycle: [{ $size: { $path: ['./data', { $path: '/data' }] } }, { $palette: 'strokes' }],
        },
        label: {
            ..._ModuleSupport.LABEL_BOXING_DEFAULTS,
            enabled: true,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'chartBackgroundColor' },
        },
        stageLabel: {
            ..._ModuleSupport.LABEL_BOXING_DEFAULTS,
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
        // @ts-expect-error undocumented option
        highlight: {
            unhighlightedItem: {
                opacity: 0.6,
            },
        },
    },
};
