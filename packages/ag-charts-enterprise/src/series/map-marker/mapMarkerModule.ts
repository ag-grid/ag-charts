import { type AgMapMarkerSeriesOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import { type SeriesModuleDefinition, ValidationError, validate } from 'ag-charts-core';

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
            maxSize: 30,
            fill: applyMapPalette({
                $applySwitch: [
                    { $path: 'type' },
                    { $mapPalette: 'fill' },
                    ['gradient', _ModuleSupport.FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS],
                    ['image', _ModuleSupport.FILL_IMAGE_DEFAULTS],
                    ['pattern', _ModuleSupport.FILL_PATTERN_DEFAULTS],
                ],
            }),
            stroke: { $mapPalette: 'stroke' },
            colorRange: {
                $if: [
                    { $eq: [{ $mapPalette: 'type' }, 'inbuilt'] },
                    { $mapPalette: 'divergingColors' },
                    applyMapPalette(_ModuleSupport.SAFE_RANGE2_OPERATION),
                ],
            },
            fillOpacity: 0.5,
            label: {
                ..._ModuleSupport.LABEL_BOXING_DEFAULTS,
                enabled: false,
                fontSize: { $ref: 'fontSize' },
                fontFamily: { $ref: 'fontFamily' },
                fontWeight: { $ref: 'fontWeight' },
                color: { $ref: 'textColor' },
            },
            highlight: applyMapPalette(_ModuleSupport.multiSeriesHighlightStyle()),
        },
        tooltip: {
            range: 'exact',
        },
    },

    create: (ctx) => new MapMarkerSeries(ctx),
    validate(options, optionsDefs, path) {
        const result = validate(options, optionsDefs, path);
        const { cleared, invalid } = result;

        if (cleared?.idKey == null && (cleared?.latitudeKey == null || cleared?.longitudeKey == null)) {
            const extendPath = (key: string) => (path ? `${path}.${key}` : key);
            const message = `Either \`${extendPath('idKey')}\` or both \`${extendPath('latitudeKey')}\` and \`${extendPath('longitudeKey')}\` are required.`;
            invalid.push(new ValidationError('required', message, null, path));
        }

        return result;
    },
};
