import { type AgWaterfallSeriesItemOptions, type WithThemeParams } from 'ag-charts-community';
import {
    FILL_GRADIENT_LINEAR_KEYED_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_KEYED_DEFAULTS,
    LABEL_BOXING_TOP_LEVEL_DEFAULTS,
    LABEL_OVERFLOW_ALWAYS_SHOW,
    LABEL_OVERFLOW_DEFAULTS,
    LABEL_PLACEMENT_STYLE_DEFAULTS,
    SINGLE_SERIES_HIGHLIGHT_STYLE,
    undocumentedThemeOptions,
} from 'ag-charts-core';
import type { ExtensibleTheme } from 'ag-charts-types';

function itemTheme(
    key: 'altUp' | 'altDown' | 'neutral',
    index: number
): WithThemeParams<AgWaterfallSeriesItemOptions<any>> {
    return {
        fill: {
            $applySwitch: [
                { $path: 'type' },
                {
                    $if: [
                        { $eq: [{ $palette: 'type' }, 'user-indexed'] },
                        { $path: [`/${index}`, { $palette: 'fill' }, { $palette: 'fills' }] },
                        { $palette: `${key}.fill` },
                    ],
                },
                ['gradient', FILL_GRADIENT_LINEAR_KEYED_DEFAULTS(key)],
                ['image', FILL_IMAGE_DEFAULTS],
                ['pattern', FILL_PATTERN_KEYED_DEFAULTS(key)],
            ],
        },
        stroke: { $palette: `${key}.stroke` },
        strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
        label: {
            ...LABEL_BOXING_TOP_LEVEL_DEFAULTS,
            ...LABEL_OVERFLOW_DEFAULTS,
            enabled: false,
            fontStyle: undefined,
            fontWeight: { $ref: 'fontWeight' as const },
            fontSize: { $ref: 'fontSize' as const },
            fontFamily: { $ref: 'fontFamily' as const },
            spacing: 6,
            padding: 6,
            collision: {
                threshold: 4,
                alwaysShow: LABEL_OVERFLOW_ALWAYS_SHOW,
                ...undocumentedThemeOptions({ collideWith: { seriesItems: true } }),
            },
            insideStyle: LABEL_PLACEMENT_STYLE_DEFAULTS('chartBackgroundColor'),
            outsideStyle: LABEL_PLACEMENT_STYLE_DEFAULTS('textColor'),
            formatter: undefined,
            placement: 'outside-end' as const,
        },
    };
}

export const WATERFALL_SERIES_THEME: ExtensibleTheme<'waterfall'> = {
    series: {
        item: {
            positive: itemTheme('altUp', 0),
            negative: itemTheme('altDown', 1),
            total: itemTheme('neutral', 2),
        },
        line: {
            stroke: { $palette: 'neutral.stroke' },
            strokeOpacity: 1,
            lineDash: [0],
            lineDashOffset: 0,
            strokeWidth: 2,
        },
        highlight: SINGLE_SERIES_HIGHLIGHT_STYLE,
    },
    legend: {
        enabled: true,
        toggleSeries: false,
    },
};
