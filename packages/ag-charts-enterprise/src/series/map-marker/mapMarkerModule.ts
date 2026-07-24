import { type AgMapMarkerSeriesOptions, VERSION } from 'ag-charts-community';
import {
    FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    LABEL_BOXING_DEFAULTS,
    MULTI_SERIES_HIGHLIGHT_STYLE,
    SAFE_RANGE2_OPERATION,
    SERIES_SELECTION_THEME,
    type SeriesModuleDefinition,
    ValidationError,
    validate,
} from 'ag-charts-core';

import { TopologyChartModule } from '../../charts/topologyChartModule';
import { MAP_THEME_DEFAULTS, applyMapPalette } from '../map-util/mapThemeDefaults';
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
            shape: 'circle',
            size: 7,
            maxSize: 30,
            fill: applyMapPalette({
                $applySwitch: [
                    { $path: 'type' },
                    { $mapPalette: 'fill' },
                    ['gradient', FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS],
                    ['image', FILL_IMAGE_DEFAULTS],
                    ['pattern', FILL_PATTERN_DEFAULTS],
                ],
            }),
            stroke: { $mapPalette: 'stroke' },
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
            },
            fillOpacity: 0.5,
            label: {
                ...LABEL_BOXING_DEFAULTS,
                enabled: false,
                fontSize: { $ref: 'fontSize' },
                fontFamily: { $ref: 'fontFamily' },
                fontWeight: { $ref: 'fontWeight' },
                color: { $ref: 'textColor' },
                collision: { alwaysShow: false },
            },
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
            const extendPath = (key: string) => (path ? `${path}.${key}` : key);
            const message = `Either \`${extendPath('idKey')}\` or both \`${extendPath('latitudeKey')}\` and \`${extendPath('longitudeKey')}\` are required.`;
            invalid.push(new ValidationError('required', message, null, path));
        }

        return result;
    },
};
