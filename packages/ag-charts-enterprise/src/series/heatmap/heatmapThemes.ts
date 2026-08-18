import { LABEL_BOXING_DEFAULTS, SAFE_RANGE2_OPERATION, SERIES_SELECTION_THEME } from 'ag-charts-core';
import type { ExtensibleSeriesTheme } from 'ag-charts-types';

export const HEATMAP_SERIES_THEME: ExtensibleSeriesTheme<'heatmap'> = {
    axes: {
        'grouped-category': {
            paddingInner: 0,
            groupPaddingInner: 0,
        },
    },
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
        colorScale: {
            fills: {
                $map: [
                    { color: { $value: '$1' } },
                    {
                        $if: [
                            { $eq: [{ $palette: 'type' }, 'inbuilt'] },
                            { $palette: 'divergingColors' },
                            SAFE_RANGE2_OPERATION,
                        ],
                    },
                ],
            },
        },
        highlight: {
            enabled: { $path: ['/highlight/enabled', true] },
            unhighlightedItem: {
                opacity: 0.6,
            },
        },
        selection: SERIES_SELECTION_THEME,
    },
    legend: {
        enabled: { $eq: [{ $path: '../series/0/colorScale/mode' }, 'discrete'] },
    },
    gradientLegend: {
        enabled: { $not: { $eq: [{ $path: '../series/0/colorScale/mode' }, 'discrete'] } },
    },
};
