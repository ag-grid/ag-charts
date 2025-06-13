import type { RequiredInternalAgGradientColor, SeriesModuleDefinition } from 'ag-charts-core';
import type { AgHistogramSeriesOptions, WithThemeParams } from 'ag-charts-types';

import type { SeriesModule } from '../../../module/coreModules';
import type { ModuleContext } from '../../../module/moduleContext';
import { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION } from '../../themes/constants';
import { DEFAULT_SHADOW_COLOUR } from '../../themes/symbols';
import { FILL_IMAGE_DEFAULTS, FILL_PATTERN_DEFAULTS, multiSeriesHighlightStyle } from '../../themes/util';
import { HistogramSeries } from './histogramSeries';
import { histogramSeriesOptionsDef } from './histogramSeriesOptionsDef';

export const HistogramSeriesModule: SeriesModule<'histogram'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['cartesian'],

    identifier: 'histogram',
    moduleFactory: (ctx) => new HistogramSeries(ctx),
    defaultAxes: [
        {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position: CARTESIAN_POSITION.BOTTOM,
        },
        {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position: CARTESIAN_POSITION.LEFT,
        },
    ],
    themeTemplate: {
        series: {
            fill: { $palette: 'fill' },
            stroke: { $palette: 'stroke' },
            // @ts-expect-error undocumented option
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
            strokeWidth: 1,
            fillOpacity: 1,
            strokeOpacity: 1,
            lineDash: [0],
            lineDashOffset: 0,
            label: {
                enabled: false,
                fontSize: { $ref: 'fontSize' },
                fontFamily: { $ref: 'fontFamily' },
                fontWeight: { $ref: 'fontWeight' },
                color: { $ref: 'chartBackgroundColor' },
            },
            shadow: {
                enabled: false,
                color: DEFAULT_SHADOW_COLOUR,
                xOffset: 3,
                yOffset: 3,
                blur: 5,
            },
            highlight: multiSeriesHighlightStyle(),
        },
    },
};

export const NewHistogramSeriesModule: SeriesModuleDefinition<AgHistogramSeriesOptions> = {
    type: 'series',
    name: 'histogram',
    chartType: 'cartesian',
    enterprise: true,

    options: histogramSeriesOptionsDef,

    create: (ctx: ModuleContext) => new HistogramSeries(ctx),
};
