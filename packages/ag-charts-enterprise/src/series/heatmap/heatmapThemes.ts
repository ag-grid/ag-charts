import { _ModuleSupport } from 'ag-charts-community';

export const HEATMAP_SERIES_THEME: _ModuleSupport.SeriesModule<'heatmap'>['themeTemplate'] = {
    series: {
        label: {
            enabled: false,
            color: { ref: 'foregroundColor' },
            fontSize: { ref: 'fontSize' },
            fontFamily: { ref: 'fontFamily' },
            wrapping: 'on-space',
            overflowStrategy: 'ellipsis',
        },
        itemPadding: 3,
    },
    gradientLegend: {
        enabled: true,
    },
};
