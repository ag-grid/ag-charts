import { _ModuleSupport } from 'ag-charts-community';
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
        // @ts-expect-error undocumented option
        colorRange: {
            $if: [
                { $eq: [{ $palette: 'type' }, 'inbuilt'] },
                { $palette: 'divergingColors' },
                _ModuleSupport.SAFE_RANGE2_OPERATION,
            ],
        },
        label: {
            ..._ModuleSupport.LABEL_BOXING_DEFAULTS,
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
            unhighlightedItem: {
                opacity: 0.4,
            },
        },
    },
    gradientLegend: {
        enabled: true,
        ..._ModuleSupport.LEGEND_CONTAINER_THEME,
    },
};
