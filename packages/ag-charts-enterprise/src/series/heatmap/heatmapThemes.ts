import { _ModuleSupport } from 'ag-charts-community';

export const HEATMAP_SERIES_THEME: _ModuleSupport.SeriesModule<'heatmap'>['themeTemplate'] = {
    series: {
        stroke: {
            $if: [
                { $eq: [{ $palette: 'type' }, 'inbuilt'] },
                { $ref: 'chartBackgroundColor' },
                { $path: ['/0', { $palette: 'stroke' }, { $palette: 'strokes' }] },
            ],
        },
        // @ts-expect-error undocumented option
        colorRange: {
            $if: [
                { $eq: [{ $palette: 'type' }, 'inbuilt'] },
                { $palette: 'divergingColors' },
                _ModuleSupport.SAFE_RANGE2_OPERATION,
            ],
        },
        label: {
            enabled: false,
            color: { $ref: 'textColor' },
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            wrapping: 'on-space',
            overflowStrategy: 'ellipsis',
        },
        itemPadding: 3,
        highlight: _ModuleSupport.singleSeriesHighlightStyle(),
    },
    gradientLegend: {
        enabled: true,
    },
};
