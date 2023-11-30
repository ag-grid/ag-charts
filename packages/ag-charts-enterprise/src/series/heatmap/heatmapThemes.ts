import { _Theme } from 'ag-charts-community';

export const HEATMAP_SERIES_THEME = {
    __extends__: _Theme.EXTENDS_SERIES_DEFAULTS,
    label: {
        __overrides__: _Theme.OVERRIDE_SERIES_LABEL_DEFAULTS,
        enabled: true,
        color: _Theme.DEFAULT_LABEL_COLOUR,
        fontStyle: undefined,
        fontSize: 16,
        minimumFontSize: 8,
        fontFamily: _Theme.DEFAULT_FONT_FAMILY,
        wrapping: 'on-space' as const,
        overflowStrategy: 'ellipsis' as const,
        spacing: 2,
    },
    secondaryLabel: {
        __overrides__: _Theme.OVERRIDE_SERIES_LABEL_DEFAULTS,
        enabled: true,
        color: _Theme.DEFAULT_LABEL_COLOUR,
        fontStyle: undefined,
        fontWeight: undefined,
        fontSize: 12,
        minimumFontSize: 7,
        fontFamily: _Theme.DEFAULT_FONT_FAMILY,
        wrapping: 'never' as const,
        overflowStrategy: 'ellipsis' as const,
    },
    padding: 3,
};
