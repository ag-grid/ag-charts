import { type AgMapShapeSeriesOptions, VERSION } from 'ag-charts-community';
import {
    COMMON_SERIES_THEME_DEFAULTS,
    FILL_GRADIENT_LINEAR_DEFAULTS,
    LABEL_BOXING_DEFAULTS,
    MULTI_SERIES_HIGHLIGHT_STYLE,
    SERIES_SELECTION_THEME,
    SERIES_TOOLTIP_THEME,
    SHADOW_THEME_DEFAULTS,
    STROKE_STYLE_THEME_DEFAULTS,
    type SeriesModuleDefinition,
    fillThemeTemplate,
    seriesLabelFontWeightOr,
    undocumentedThemeOptions,
} from 'ag-charts-core';

import { TopologyChartModule } from '../../charts/topologyChartModule';
import { MAP_COLOR_SCALE_THEME, MAP_THEME_DEFAULTS, applyMapPalette } from '../map-util/mapThemeDefaults';
import { MapShapeSeries } from './mapShapeSeries';
import { mapShapeSeriesOptionsDef, mapShapeSeriesThemeableOptionsDef } from './mapShapeSeriesOptionsDef';

export const MapShapeSeriesModule: SeriesModuleDefinition<AgMapShapeSeriesOptions> = {
    type: 'series',
    name: 'map-shape',
    chartType: 'topology',
    enterprise: true,
    version: VERSION,
    dependencies: [TopologyChartModule],

    options: mapShapeSeriesOptionsDef,

    themeOptions: mapShapeSeriesThemeableOptionsDef,
    themeTemplate: {
        ...MAP_THEME_DEFAULTS,
        series: {
            ...COMMON_SERIES_THEME_DEFAULTS,
            ...undocumentedThemeOptions({ topologyIdKey: 'name' }),
            fill: applyMapPalette(fillThemeTemplate(FILL_GRADIENT_LINEAR_DEFAULTS)),
            stroke: { $ref: 'chartBackgroundColor' },
            shadow: SHADOW_THEME_DEFAULTS,
            colorScale: MAP_COLOR_SCALE_THEME,
            fillOpacity: 1,
            strokeWidth: 1,
            ...STROKE_STYLE_THEME_DEFAULTS,
            padding: 2,
            label: {
                ...LABEL_BOXING_DEFAULTS,
                // The shape always bounds the label, so the shared opt-in triggers do not apply: wrapping is
                // always on and overflow hides unless `truncate` (or the deprecated `ellipsis`) is asked for.
                wrapping: 'on-space',
                truncate: {
                    $isUserOption: [
                        './overflowStrategy',
                        { $eq: [{ $path: './overflowStrategy' }, 'ellipsis'] },
                        undefined,
                    ],
                },
                enabled: true,
                color: { $ref: 'chartBackgroundColor' },
                fontFamily: { $ref: 'seriesLabelFontFamily' },
                fontSize: { $ref: 'seriesLabelFontSize' },
                fontWeight: seriesLabelFontWeightOr('bold'),
            },
            tooltip: SERIES_TOOLTIP_THEME,
            highlight: applyMapPalette(MULTI_SERIES_HIGHLIGHT_STYLE),
            selection: SERIES_SELECTION_THEME,
        },
        tooltip: {
            range: 'exact',
        },
    },

    create: (ctx) => new MapShapeSeries(ctx),
};
