import { type AgMapMarkerSeriesOptions, VERSION } from 'ag-charts-community';
import {
    COMMON_SERIES_THEME_DEFAULTS,
    FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS,
    FONT_THEME_DEFAULTS,
    LABEL_BOXING_DEFAULTS,
    LABEL_OVERFLOW_DEFAULTS,
    MULTI_SERIES_HIGHLIGHT_STYLE,
    SERIES_SELECTION_THEME,
    SHADOW_THEME_DEFAULTS,
    STROKE_STYLE_THEME_DEFAULTS,
    type SeriesModuleDefinition,
    ValidationError,
    fillThemeTemplate,
    undocumentedThemeOptions,
    validate,
} from 'ag-charts-core';

import { TopologyChartModule } from '../../charts/topologyChartModule';
import { MAP_COLOR_SCALE_THEME, MAP_THEME_DEFAULTS, applyMapPalette } from '../map-util/mapThemeDefaults';
import { MapMarkerSeries } from './mapMarkerSeries';
import { mapMarkerSeriesOptionsDef } from './mapMarkerSeriesOptionsDef';

export const MapMarkerSeriesModule: SeriesModuleDefinition<AgMapMarkerSeriesOptions> = {
    type: 'series',
    name: 'map-marker',
    chartType: 'topology',
    enterprise: true,
    version: VERSION,
    dependencies: [TopologyChartModule],

    options: mapMarkerSeriesOptionsDef,
    themeTemplate: {
        ...MAP_THEME_DEFAULTS,
        series: {
            ...COMMON_SERIES_THEME_DEFAULTS,
            ...undocumentedThemeOptions({ topologyIdKey: 'name' }),
            shape: 'circle',
            size: 7,
            maxSize: 30,
            fill: applyMapPalette(fillThemeTemplate(FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS, { $mapPalette: 'fill' })),
            stroke: { $mapPalette: 'stroke' },
            colorScale: MAP_COLOR_SCALE_THEME,
            fillOpacity: 0.5,
            strokeWidth: 1,
            ...STROKE_STYLE_THEME_DEFAULTS,
            shadow: SHADOW_THEME_DEFAULTS,
            label: {
                ...LABEL_BOXING_DEFAULTS,
                ...LABEL_OVERFLOW_DEFAULTS,
                enabled: false,
                placement: 'bottom',
                ...FONT_THEME_DEFAULTS,
                color: { $ref: 'textColor' },
                collision: { alwaysShow: false },
            },
            tooltip: { interaction: { enabled: false } },
            highlight: applyMapPalette(MULTI_SERIES_HIGHLIGHT_STYLE),
            selection: SERIES_SELECTION_THEME,
        },
        tooltip: {
            range: 'exact',
        },
    },

    create: (ctx) => new MapMarkerSeries(ctx),
    validate(options, optionsDefs, path, opts) {
        const result = validate(options, optionsDefs, path, opts);
        const { cleared, invalid } = result;

        if (cleared?.idKey == null && (cleared?.latitudeKey == null || cleared?.longitudeKey == null)) {
            const extendPath = (key: string) => (path === '' ? key : `${path}.${key}`);
            const message = `Either \`${extendPath('idKey')}\` or both \`${extendPath('latitudeKey')}\` and \`${extendPath('longitudeKey')}\` are required.`;
            invalid.push(new ValidationError('required', message, null, path));
        }

        return result;
    },
};
