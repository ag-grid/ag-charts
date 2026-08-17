import {
    FILL_PATTERN_DEFAULTS,
    LABEL_BOXING_DEFAULTS,
    PART_WHOLE_HIGHLIGHT_STYLE,
    SERIES_SELECTION_THEME,
} from 'ag-charts-core';
import type { ExtensibleTheme } from 'ag-charts-types';

import { pieTheme } from './pieTheme';

export const donutTheme: ExtensibleTheme<'donut'> = {
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
