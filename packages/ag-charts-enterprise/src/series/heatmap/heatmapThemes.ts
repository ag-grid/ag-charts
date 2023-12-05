import { AgHeatmapSeriesOptions, _Theme } from 'ag-charts-community';

export const HEATMAP_SERIES_THEME: Partial<
    AgHeatmapSeriesOptions & { __extends__?: any; label: { __overrides__?: any } }
> = {
    __extends__: _Theme.EXTENDS_SERIES_DEFAULTS,
    label: {
        __overrides__: _Theme.OVERRIDE_SERIES_LABEL_DEFAULTS,
        enabled: false,
        color: _Theme.DEFAULT_LABEL_COLOUR,
        fontStyle: undefined,
        fontSize: 16,
        minimumFontSize: undefined,
        fontFamily: _Theme.DEFAULT_FONT_FAMILY,
        wrapping: 'on-space' as const,
        overflowStrategy: 'ellipsis' as const,
        spacing: 2,
    },
    itemPadding: 3,
};
