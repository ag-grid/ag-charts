import { LABEL_BOXING_DEFAULTS, PART_WHOLE_HIGHLIGHT_STYLE, SERIES_SELECTION_THEME } from 'ag-charts-core';
import type { ExtensibleSeriesTheme } from 'ag-charts-types';

import { pieTheme } from './pieTheme';

export const donutTheme: ExtensibleSeriesTheme<'donut'> = {
    ...pieTheme,
    series: {
        ...pieTheme.series,
        innerRadiusRatio: {
            $if: [{ $eq: [{ $path: ['./innerRadiusOffset', undefined] }, undefined] }, 0.7, undefined],
        },
        innerLabels: {
            $apply: {
                ...LABEL_BOXING_DEFAULTS,
                fontSize: { $ref: 'fontSize' },
                fontFamily: { $ref: 'fontFamily' },
                fontWeight: { $ref: 'fontWeight' },
                color: { $ref: 'textColor' },
                spacing: 2,
            },
        },
        highlight: PART_WHOLE_HIGHLIGHT_STYLE,
        selection: SERIES_SELECTION_THEME,
    },
};
