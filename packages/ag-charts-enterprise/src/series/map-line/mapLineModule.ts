import { type AgMapLineSeriesOptions, VERSION } from 'ag-charts-community';
import {
    COMMON_SERIES_THEME_DEFAULTS,
    LABEL_BOXING_DEFAULTS,
    LABEL_OVERFLOW_DEFAULTS,
    MULTI_SERIES_HIGHLIGHT_STYLE,
    SAFE_STROKE_FILL_OPERATION,
    SERIES_SELECTION_THEME,
    SERIES_TOOLTIP_THEME,
    STROKE_STYLE_THEME_DEFAULTS,
    type SeriesModuleDefinition,
    undocumentedThemeOptions,
} from 'ag-charts-core';

import { TopologyChartModule } from '../../charts/topologyChartModule';
import { MAP_COLOR_SCALE_THEME, MAP_THEME_DEFAULTS, applyMapPalette } from '../map-util/mapThemeDefaults';
import { MapLineSeries } from './mapLineSeries';
import { mapLineSeriesOptionsDef, mapLineSeriesThemeableOptionsDef } from './mapLineSeriesOptionsDef';

export const MapLineSeriesModule: SeriesModuleDefinition<AgMapLineSeriesOptions> = {
    type: 'series',
    name: 'map-line',
    chartType: 'topology',
    enterprise: true,
    version: VERSION,
    dependencies: [TopologyChartModule],

    options: mapLineSeriesOptionsDef,

    themeOptions: mapLineSeriesThemeableOptionsDef,
    themeTemplate: {
        ...MAP_THEME_DEFAULTS,
        series: {
            ...COMMON_SERIES_THEME_DEFAULTS,
            ...undocumentedThemeOptions({ topologyIdKey: 'name' }),
            stroke: applyMapPalette(SAFE_STROKE_FILL_OPERATION),
            colorScale: MAP_COLOR_SCALE_THEME,
            strokeWidth: 1,
            ...STROKE_STYLE_THEME_DEFAULTS,
            maxStrokeWidth: 3,
            label: {
                ...LABEL_BOXING_DEFAULTS,
                ...LABEL_OVERFLOW_DEFAULTS,
                enabled: true,
                fontSize: { $ref: 'seriesLabelFontSize' },
                fontFamily: { $ref: 'seriesLabelFontFamily' },
                fontWeight: { $ref: 'seriesLabelFontWeight' },
                color: { $ref: 'textColor' },
                collision: { alwaysShow: false },
            },
            tooltip: { ...SERIES_TOOLTIP_THEME, interaction: { enabled: false } },
            highlight: applyMapPalette(MULTI_SERIES_HIGHLIGHT_STYLE),
            selection: SERIES_SELECTION_THEME,
        },
        tooltip: {
            range: 'exact',
        },
    },

    create: (ctx) => new MapLineSeries(ctx),
};
