import type { ExtensibleTheme } from 'ag-charts-types';

import { LABEL_BOXING_DEFAULTS, partWholeHighlightStyle } from '../../themes/util';
import { pieTheme } from './pieTheme';

export const donutTheme: ExtensibleTheme<'donut'> = {
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
        } as any,
        highlight: partWholeHighlightStyle(),
    },
};
