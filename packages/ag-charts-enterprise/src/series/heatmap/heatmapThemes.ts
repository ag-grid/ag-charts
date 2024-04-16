import { _Theme } from 'ag-charts-community';

export const HEATMAP_SERIES_THEME = {
    series: {
        __extends__: _Theme.EXTENDS_SERIES_DEFAULTS,
        label: {
            enabled: false,
            color: _Theme.DEFAULT_LABEL_COLOUR,
            fontSize: _Theme.FONT_SIZE.SMALL,
            fontFamily: _Theme.DEFAULT_FONT_FAMILY,
            wrapping: 'on-space' as const,
            overflowStrategy: 'ellipsis' as const,
        },
        itemPadding: 3,
    },
    gradientLegend: {
        enabled: true,
    },
};
