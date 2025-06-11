import type { RequiredInternalAgGradientColor, SeriesModuleDefinition } from 'ag-charts-core';
import type { AgAreaSeriesOptions, WithThemeParams } from 'ag-charts-types';

import type { SeriesModule } from '../../../module/coreModules';
import type { ModuleContext } from '../../../module/moduleContext';
import { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION } from '../../themes/constants';
import { DEFAULT_SHADOW_COLOUR } from '../../themes/symbols';
import { FILL_IMAGE_DEFAULTS, FILL_PATTERN_DEFAULTS, multiSeriesHighlightStyle } from '../../themes/util';
import { AreaSeries } from './areaSeries';
import { areaSeriesOptionsDef } from './areaSeriesOptionsDef';

export const AreaSeriesModule: SeriesModule<'area'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['cartesian'],

    identifier: 'area',
    moduleFactory: (ctx) => new AreaSeries(ctx),
    stackable: true,
    defaultAxes: [
        {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position: CARTESIAN_POSITION.LEFT,
        },
        {
            type: CARTESIAN_AXIS_TYPE.CATEGORY,
            position: CARTESIAN_POSITION.BOTTOM,
        },
    ],
    themeTemplate: {
        series: {
            nodeClickRange: 'nearest',
            fill: { $palette: 'fill' },
            fillGradientDefaults: {
                type: 'gradient',
                gradient: 'linear',
                bounds: 'item',
                colorStops: { $palette: 'gradient' },
                rotation: 0,
                reverse: false,
            } satisfies WithThemeParams<RequiredInternalAgGradientColor>,
            fillPatternDefaults: FILL_PATTERN_DEFAULTS,
            fillImageDefaults: FILL_IMAGE_DEFAULTS,
            stroke: { $palette: 'stroke' },
            fillOpacity: 0.8,
            strokeOpacity: 1,
            strokeWidth: 0,
            lineDash: [0],
            lineDashOffset: 0,
            shadow: {
                enabled: false,
                color: DEFAULT_SHADOW_COLOUR,
                xOffset: 3,
                yOffset: 3,
                blur: 5,
            },
            interpolation: {
                type: 'linear',
            },
            marker: {
                enabled: false,
                shape: 'circle',
                size: 7,
                strokeWidth: 0,
                fill: { $palette: 'fill' },
                stroke: { $palette: 'stroke' },
                // @ts-expect-error undocumented option
                fillGradientDefaults: {
                    type: 'gradient',
                    gradient: 'radial',
                    bounds: 'item',
                    colorStops: { $palette: 'gradient' },
                    rotation: 0,
                    reverse: true,
                } satisfies WithThemeParams<RequiredInternalAgGradientColor>,
                fillPatternDefaults: FILL_PATTERN_DEFAULTS,
            },
            label: {
                enabled: false,
                fontSize: { $ref: 'fontSize' },
                fontFamily: { $ref: 'fontFamily' },
                fontWeight: { $ref: 'fontWeight' },
                color: { $ref: 'textColor' },
            },
            tooltip: {
                range: { $path: ['/tooltip/range', 'nearest'] },
                position: {
                    anchorTo: { $path: ['/tooltip/position/anchorTo', 'node'] },
                },
            },
            highlight: multiSeriesHighlightStyle(),
        },
    },
};

export const NewAreaSeriesModule: SeriesModuleDefinition<AgAreaSeriesOptions> = {
    type: 'series',
    name: 'area',
    chartType: 'cartesian',

    options: areaSeriesOptionsDef,

    create: (ctx: ModuleContext) => new AreaSeries(ctx),
};
