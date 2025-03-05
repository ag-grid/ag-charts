import { _ModuleSupport } from 'ag-charts-community';

const itemTheme = {
    strokeWidth: 0,
    label: {
        enabled: false,
        fontStyle: undefined,
        fontWeight: { $ref: 'fontWeight' as const },
        fontSize: { $ref: 'fontSize' as const },
        fontFamily: { $ref: 'fontFamily' as const },
        color: { $ref: 'textColor' as const },
        formatter: undefined,
        placement: 'outside-end' as const,
    },
};

export const WATERFALL_SERIES_THEME: _ModuleSupport.SeriesModule<'waterfall'>['themeTemplate'] = {
    series: {
        item: {
            positive: {
                ...itemTheme,
                fill: {
                    $if: [
                        { $eq: [{ $palette: 'type' }, 'user-indexed'] },
                        { $path: ['./0', { $palette: 'fill' }, { $palette: 'fills' }] },
                        { $palette: 'altUp.fill' },
                    ],
                },
                stroke: { $palette: 'altUp.stroke' },
                // @ts-expect-error undocumented-option
                defaultColorRange: { $path: ['./0', { $palette: 'fill' }, { $palette: 'sequentialColors' }] },
                label: {
                    ...itemTheme.label,
                    color: { $ref: 'textColor' },
                },
            },
            negative: {
                ...itemTheme,
                fill: {
                    $if: [
                        { $eq: [{ $palette: 'type' }, 'user-indexed'] },
                        { $path: ['./1', { $palette: 'fill' }, { $palette: 'fills' }] },
                        { $palette: 'altDown.fill' },
                    ],
                },
                stroke: { $palette: 'altDown.stroke' },
                // @ts-expect-error undocumented-option
                defaultColorRange: { $path: ['./1', { $palette: 'fill' }, { $palette: 'sequentialColors' }] },
                label: {
                    ...itemTheme.label,
                    color: { $ref: 'textColor' },
                },
            },
            total: {
                ...itemTheme,
                fill: {
                    $if: [
                        { $eq: [{ $palette: 'type' }, 'user-indexed'] },
                        { $path: ['./2', { $palette: 'fill' }, { $palette: 'fills' }] },
                        { $palette: 'neutral.fill' },
                    ],
                },
                stroke: { $palette: 'neutral.stroke' },
                // @ts-expect-error undocumented-option
                defaultColorRange: { $path: ['./2', { $palette: 'fill' }, { $palette: 'sequentialColors' }] },
                label: {
                    ...itemTheme.label,
                    color: { $ref: 'textColor' },
                },
            },
        },
        line: {
            stroke: { $palette: 'neutral.stroke' },
            strokeOpacity: 1,
            lineDash: [0],
            lineDashOffset: 0,
            strokeWidth: 2,
        },
    },
    legend: {
        enabled: true,
        toggleSeries: false,
    },
};
