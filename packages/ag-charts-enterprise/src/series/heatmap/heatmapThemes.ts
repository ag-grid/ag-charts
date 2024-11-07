import { _ModuleSupport } from 'ag-charts-community';

const {
    ThemeSymbols: { DEFAULT_FONT_FAMILY, DEFAULT_LABEL_COLOUR },
    ThemeConstants: { FONT_SIZE },
} = _ModuleSupport;

export const HEATMAP_SERIES_THEME = {
    series: {
        label: {
            enabled: false,
            color: DEFAULT_LABEL_COLOUR,
            fontSize: FONT_SIZE.SMALL,
            fontFamily: DEFAULT_FONT_FAMILY,
            wrapping: 'on-space' as const,
            overflowStrategy: 'ellipsis' as const,
        },
        itemPadding: 3,
    },
    gradientLegend: {
        enabled: true,
    },
};
