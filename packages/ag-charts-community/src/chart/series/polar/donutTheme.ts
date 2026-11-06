import {
    FILL_PATTERN_DEFAULTS,
    ITEM_GLOW_BUCKETS,
    LABEL_BOXING_DEFAULTS,
    PART_WHOLE_HIGHLIGHT_STYLE,
    SERIES_GLOW_BUCKETS,
    SERIES_SELECTION_THEME,
    themeLineHeight,
    withSeriesGlowThemeDefaults,
} from 'ag-charts-core';
import type { ExtensibleSeriesTheme } from 'ag-charts-types';

import { pieTheme } from './pieTheme';

export const donutTheme: ExtensibleSeriesTheme<'donut'> = {
    ...pieTheme,
    series: {
        ...pieTheme.series,
        innerRadiusRatio: {
            $if: [{ $eq: [{ $path: ['./innerRadiusOffset', undefined] }, undefined] }, 0.7, undefined],
        },
        innerCircle: {
            fill: {
                $applySwitch: [
                    { $path: 'type' },
                    { $value: '$1' },
                    [
                        'pattern',
                        {
                            ...FILL_PATTERN_DEFAULTS,
                            fill: { $ref: 'foregroundColor' },
                            stroke: { $ref: 'foregroundColor' },
                        },
                    ],
                ],
            },
        },
        innerLabels: {
            $apply: {
                ...LABEL_BOXING_DEFAULTS,
                fontSize: { $ref: 'seriesLabelFontSize' },
                lineHeight: themeLineHeight('seriesLabelLineHeight'),
                fontFamily: { $ref: 'seriesLabelFontFamily' },
                fontWeight: { $ref: 'seriesLabelFontWeight' },
                color: { $ref: 'textColor' },
                spacing: 2,
            },
        },
        highlight: withSeriesGlowThemeDefaults(
            { ...PART_WHOLE_HIGHLIGHT_STYLE, bringToFront: true },
            { item: ITEM_GLOW_BUCKETS, series: SERIES_GLOW_BUCKETS }
        ),
        selection: SERIES_SELECTION_THEME,
    },
};
