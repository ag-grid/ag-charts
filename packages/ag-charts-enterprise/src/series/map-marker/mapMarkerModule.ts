import { type AgMapMarkerSeriesOptions, type WithThemeParams, _ModuleSupport } from 'ag-charts-community';
import { type InternalAgGradientColor, type SeriesModuleDefinition, ValidationError, validate } from 'ag-charts-core';

import { MAP_THEME_DEFAULTS } from '../map-util/mapThemeDefaults';
import { MapMarkerSeries } from './mapMarkerSeries';
import { mapMarkerSeriesOptionsDef } from './mapMarkerSeriesOptionsDef';

export const MapMarkerModule: _ModuleSupport.SeriesModule<'map-marker'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['topology'],

    identifier: 'map-marker',
    moduleFactory: (ctx) => new MapMarkerSeries(ctx),
    tooltipDefaults: { range: 'exact' },
    themeTemplate: {
        ...MAP_THEME_DEFAULTS,
        series: {
            shape: 'circle',
            maxSize: 30,
            fill: { $palette: 'fill' },
            stroke: { $palette: 'stroke' },
            colorRange: {
                $if: [
                    { $eq: [{ $palette: 'type' }, 'inbuilt'] },
                    { $palette: 'divergingColors' },
                    { $palette: 'range2' },
                ],
            },
            // @ts-expect-error undocumented option
            fillGradientDefaults: {
                type: 'gradient',
                gradient: 'radial',
                bounds: 'item',
                colorStops: { $palette: 'gradient' },
                rotation: 0,
                reverse: true,
            } satisfies WithThemeParams<Required<InternalAgGradientColor>>,
            fillOpacity: 0.5,
            label: {
                color: { $ref: 'textColor' },
            },
        },
    },
};

export const MapMarkerSeriesModule: SeriesModuleDefinition<AgMapMarkerSeriesOptions> = {
    type: 'series',
    name: 'map-marker',
    chartType: 'topology',
    enterprise: true,

    options: mapMarkerSeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new MapMarkerSeries(ctx),
    validate(options, optionsDefs, path) {
        const result = validate(options, optionsDefs, path);

        if (result.valid?.idKey == null && (result.valid?.latitudeKey == null || result.valid?.longitudeKey == null)) {
            const extendPath = (key: string) => (path ? `${path}.${key}` : key);
            const message = `Either \`${extendPath('idKey')}\` or both \`${extendPath('latitudeKey')}\` and \`${extendPath('longitudeKey')}\` are required.`;
            result.errors.push(new ValidationError(message, path, true));
        }

        return result;
    },
};
