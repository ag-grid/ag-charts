import { type AgMapShapeSeriesOptions, VERSION } from 'ag-charts-community';
import {
    COMMON_SERIES_THEME_DEFAULTS,
    FILL_GRADIENT_LINEAR_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    LABEL_BOXING_DEFAULTS,
    MULTI_SERIES_HIGHLIGHT_STYLE,
    SAFE_RANGE2_OPERATION,
    SERIES_SELECTION_THEME,
    type SeriesModuleDefinition,
    undocumentedThemeOptions,
} from 'ag-charts-core';

import { TopologyChartModule } from '../../charts/topologyChartModule';
import { MAP_THEME_DEFAULTS, applyMapPalette } from '../map-util/mapThemeDefaults';
import { MapShapeSeries } from './mapShapeSeries';
import { mapShapeSeriesOptionsDef } from './mapShapeSeriesOptionsDef';

export const MapShapeSeriesModule: SeriesModuleDefinition<AgMapShapeSeriesOptions> = {
    type: 'series',
    name: 'map-shape',
    chartType: 'topology',
    enterprise: true,
    version: VERSION,
    dependencies: [TopologyChartModule],

    options: mapShapeSeriesOptionsDef,
    themeTemplate: {
        ...MAP_THEME_DEFAULTS,
        series: {
            ...COMMON_SERIES_THEME_DEFAULTS,
            ...undocumentedThemeOptions({ topologyIdKey: 'name' }),
            fill: applyMapPalette({
                $applySwitch: [
                    { $path: 'type' },
                    { $mapPalette: 'fill' },
                    ['gradient', FILL_GRADIENT_LINEAR_DEFAULTS],
                    ['image', FILL_IMAGE_DEFAULTS],
                    ['pattern', FILL_PATTERN_DEFAULTS],
                ],
            }),
            stroke: { $ref: 'chartBackgroundColor' },
            colorScale: {
                fills: {
                    $map: [
                        { color: { $value: '$1' } },
                        {
                            $if: [
                                { $eq: [{ $mapPalette: 'type' }, 'inbuilt'] },
                                { $mapPalette: 'divergingColors' },
                                applyMapPalette(SAFE_RANGE2_OPERATION),
                            ],
                        },
                    ],
                },
                mode: 'continuous',
            },
            fillOpacity: 1,
            strokeWidth: 1,
            strokeOpacity: 1,
            lineDash: [0],
            lineDashOffset: 0,
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
                fontFamily: { $ref: 'fontFamily' },
                fontSize: { $ref: 'fontSize' },
                fontWeight: 'bold',
            },
            tooltip: { interaction: { enabled: false } },
            highlight: applyMapPalette(MULTI_SERIES_HIGHLIGHT_STYLE),
            selection: SERIES_SELECTION_THEME,
        },
        tooltip: {
            range: 'exact',
        },
    },

    create: (ctx) => new MapShapeSeries(ctx),
};
