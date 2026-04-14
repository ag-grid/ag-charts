import { LABEL_BOXING_DEFAULTS, SAFE_RANGE2_OPERATION } from 'ag-charts-core';
import type { ExtensibleTheme } from 'ag-charts-types';

export const HEATMAP_SERIES_THEME: ExtensibleTheme<'heatmap'> = {
    series: {
        stroke: {
            $if: [
                { $eq: [{ $palette: 'type' }, 'inbuilt'] },
                { $ref: 'chartBackgroundColor' },
                { $path: ['/0', { $palette: 'stroke' }, { $palette: 'strokes' }] },
            ],
        },
        strokeWidth: { $isUserOption: ['./stroke', 2, undefined] },
        label: {
            ...LABEL_BOXING_DEFAULTS,
            enabled: false,
            color: { $ref: 'textColor' },
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            wrapping: 'on-space',
            overflowStrategy: 'ellipsis',
        },
        itemPadding: 3,
        highlight: {
            enabled: { $path: ['/highlight/enabled', true] },
            unhighlightedItem: {
                opacity: 0.6,
            },
        },
    },
    legend: {
        enabled: { $eq: [{ $path: '../series/0/colorScale/mode' }, 'discrete'] },
    },
    gradientLegend: {
        enabled: { $not: { $eq: [{ $path: '../series/0/colorScale/mode' }, 'discrete'] } },
    },
};

// @ts-expect-error undocumented option
HEATMAP_SERIES_THEME.series.colorRange = {
    $if: [{ $eq: [{ $palette: 'type' }, 'inbuilt'] }, { $palette: 'divergingColors' }, SAFE_RANGE2_OPERATION],
};
