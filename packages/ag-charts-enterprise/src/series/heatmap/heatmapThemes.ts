import { _ModuleSupport } from 'ag-charts-community';

const {
    ThemeSymbols: { DEFAULT_LABEL_COLOUR },
} = _ModuleSupport;

export const HEATMAP_SERIES_THEME = {
    series: {
        label: {
            enabled: false,
            color: DEFAULT_LABEL_COLOUR,
            fontSize: { ref: 'fontSize' as const },
            fontFamily: { ref: 'fontFamily' as const },
            wrapping: 'on-space' as const,
            overflowStrategy: 'ellipsis' as const,
        },
        itemPadding: 3,
    },
    gradientLegend: {
        enabled: true,
    },
};
