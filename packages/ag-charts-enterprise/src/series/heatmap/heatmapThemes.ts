import { _ModuleSupport } from 'ag-charts-community';

export const HEATMAP_SERIES_THEME: _ModuleSupport.SeriesModule<'heatmap'>['themeTemplate'] = {
    series: {
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
    },
    gradientLegend: {
        enabled: true,
    },
};
